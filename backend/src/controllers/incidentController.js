const Incident = require('../models/Incident');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const logAuditAction = require('../utils/auditLogger');

// @desc Get incidents with branch scoping
// @route GET /api/incidents
const getIncidents = async (req, res) => {
  try {
    const { severity, status, vehicleId } = req.query;
    let query = { ...req.branchFilter };

    if (severity) query.severity = severity;
    if (status) query.status = status;
    if (vehicleId) query.vehicle = vehicleId;

    if (req.user.role === 'Driver') {
      const driverRecord = await Driver.findOne({ user: req.user._id });
      if (driverRecord) query.driver = driverRecord._id;
    }

    const incidents = await Incident.find(query)
      .populate('vehicle', 'plateNumber make model type')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name email phone' } })
      .populate('trip', 'tripNumber origin destination')
      .populate('branch', 'name code')
      .sort({ dateTime: -1 });

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

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    let finalDriverId = driverId;
    if (!finalDriverId && req.user.role === 'Driver') {
      const driverRecord = await Driver.findOne({ user: req.user._id });
      if (driverRecord) finalDriverId = driverRecord._id;
    }

    const count = await Incident.countDocuments();
    const incidentNumber = `INC-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const incident = new Incident({
      incidentNumber,
      vehicle: vehicleId,
      driver: finalDriverId,
      trip: tripId || null,
      branch: vehicle.branch,
      dateTime: dateTime || new Date(),
      location,
      severity,
      description,
      evidenceFiles: evidenceFiles || [],
      estimatedLossAmount: estimatedLossAmount || 0,
      status: 'Reported'
    });

    await incident.save();

    await logAuditAction({
      action: 'INCIDENT_REPORTED',
      user: req.user,
      branch: vehicle.branch,
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
