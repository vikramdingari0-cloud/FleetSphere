const Incident = require('../models/Incident');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const logAuditAction = require('../utils/auditLogger');
const { canAccessBranch, canAccessTenant } = require('../middleware/authMiddleware');

// @desc Get incidents with branch scoping & pagination
// @route GET /api/incidents
const getIncidents = async (req, res) => {
  try {
    const { severity, status, vehicleId, page, limit } = req.query;
    let query = { ...req.branchFilter };

    if (severity && severity !== 'ALL') query.severity = severity;
    if (status && status !== 'ALL') query.status = status;
    if (vehicleId) query.vehicle = vehicleId;

    if (req.user.role === 'Driver') {
      const driverRecord = await Driver.findOne({ user: req.user._id });
      if (driverRecord) query.driver = driverRecord._id;
    }

    const total = await Incident.countDocuments(query);
    res.set('X-Total-Count', total);

    let queryBuilder = Incident.find(query)
      .populate('vehicle', 'plateNumber make model type')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name email phone' } })
      .populate('trip', 'tripNumber origin destination')
      .populate('branch', 'name code city')
      .sort({ dateTime: -1 });

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      queryBuilder = queryBuilder.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const incidents = await queryBuilder;

    if (req.query.paginated === 'true') {
      const limitNum = parseInt(limit, 10) || 10;
      return res.json({
        data: incidents,
        pagination: {
          total,
          page: parseInt(page, 10) || 1,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    res.json(incidents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create incident report
// @route POST /api/incidents
const createIncident = async (req, res) => {
  try {
    const {
      vehicleId,
      driverId,
      tripId,
      dateTime,
      location,
      severity,
      description,
      evidenceFiles,
      estimatedLossAmount
    } = req.body;

    if (!vehicleId || !severity || !description || !location) {
      return res.status(400).json({ message: 'Vehicle, severity, description, and location are required' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    if (!canAccessTenant(req.user, vehicle.organization)) {
      return res.status(403).json({ message: 'Access denied: Cross-organization incident report forbidden' });
    }
    if (!canAccessBranch(req.user, vehicle.branch)) {
      return res.status(403).json({ message: 'Access denied: Vehicle belongs to another branch' });
    }

    let finalDriverId = driverId;
    if (!finalDriverId && req.user.role === 'Driver') {
      const driverRecord = await Driver.findOne({ user: req.user._id });
      if (driverRecord) finalDriverId = driverRecord._id;
    }

    const count = await Incident.countDocuments();
    const incidentNumber = `INC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const organization = req.user.organization ? (req.user.organization._id || req.user.organization) : vehicle.organization;

    const incident = new Incident({
      incidentNumber,
      vehicle: vehicleId,
      driver: finalDriverId,
      trip: tripId || null,
      branch: vehicle.branch,
      organization,
      dateTime: dateTime || new Date(),
      location,
      severity,
      description,
      evidenceFiles: evidenceFiles || [],
      estimatedLossAmount: estimatedLossAmount ? Number(estimatedLossAmount) : 0,
      status: 'Reported'
    });

    await incident.save();

    await logAuditAction({
      action: 'INCIDENT_REPORTED',
      user: req.user,
      branch: vehicle.branch,
      organization,
      details: `Incident reported: ${incidentNumber} (${severity}) - ${description.substring(0, 50)}...`
    });

    res.status(201).json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update incident status / resolution
// @route PUT /api/incidents/:id
const updateIncident = async (req, res) => {
  try {
    const { status, actionTaken, investigationNotes, insuranceClaimed, insuranceClaimDetails } = req.body;

    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ message: 'Incident not found' });

    if (!canAccessTenant(req.user, incident.organization)) {
      return res.status(403).json({ message: 'Access denied: Cross-organization modification forbidden' });
    }
    if (!canAccessBranch(req.user, incident.branch)) {
      return res.status(403).json({ message: 'Access denied: Incident belongs to another branch' });
    }

    if (status) incident.status = status;
    if (actionTaken !== undefined) incident.actionTaken = actionTaken;
    if (investigationNotes !== undefined) incident.investigationNotes = investigationNotes;
    if (insuranceClaimed !== undefined) incident.insuranceClaimed = insuranceClaimed;
    if (insuranceClaimDetails !== undefined) incident.insuranceClaimDetails = insuranceClaimDetails;

    await incident.save();

    await logAuditAction({
      action: 'INCIDENT_UPDATED',
      user: req.user,
      branch: incident.branch,
      organization: incident.organization,
      details: `Updated incident ${incident.incidentNumber} status to ${incident.status}`
    });

    res.json(incident);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getIncidents,
  createIncident,
  updateIncident
};
