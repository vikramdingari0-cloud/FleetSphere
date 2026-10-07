const MaintenanceJob = require('../models/MaintenanceJob');
const Vehicle = require('../models/Vehicle');
const logAuditAction = require('../utils/auditLogger');
const { canAccessBranch, canAccessTenant } = require('../middleware/authMiddleware');

// @desc Get maintenance jobs with filtering & pagination
// @route GET /api/maintenance
const getMaintenanceJobs = async (req, res) => {
  try {
    const { status, type, priority, page, limit } = req.query;
    let query = { ...req.branchFilter };

    if (status && status !== 'ALL') query.status = status;
    if (type && type !== 'ALL') query.type = type;
    if (priority && priority !== 'ALL') query.priority = priority;

    const total = await MaintenanceJob.countDocuments(query);
    res.set('X-Total-Count', total);

    let queryBuilder = MaintenanceJob.find(query)
      .populate('vehicle', 'plateNumber make model currentOdometer status fuelType')
      .populate('branch', 'name code city')
      .populate('createdFromIncident')
      .sort({ scheduledDate: -1 });

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      queryBuilder = queryBuilder.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const jobs = await queryBuilder;

    if (req.query.paginated === 'true') {
      const limitNum = parseInt(limit, 10) || 10;
      return res.json({
        data: jobs,
        pagination: {
          total,
          page: parseInt(page, 10) || 1,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create maintenance job
// @route POST /api/maintenance
const createMaintenanceJob = async (req, res) => {
  try {
    const {
      vehicleId,
      branchId,
      type,
      priority,
      scheduledDate,
      estimatedCost,
      serviceProvider,
      workDescription,
      partsReplaced,
      incidentId
    } = req.body;

    if (!vehicleId || !type || !scheduledDate || !workDescription) {
      return res.status(400).json({ message: 'Vehicle, maintenance type, scheduled date, and work description are required' });
    }

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    if (!canAccessTenant(req.user, vehicle.organization)) {
      return res.status(403).json({ message: 'Access denied: Cross-organization maintenance scheduling forbidden' });
    }
    if (!canAccessBranch(req.user, vehicle.branch)) {
      return res.status(403).json({ message: 'Access denied: Vehicle belongs to another branch' });
    }

    const count = await MaintenanceJob.countDocuments();
    const jobNumber = `MAINT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    let branch;
    if (req.user.role === 'Branch Manager') {
      branch = req.user.branch ? (req.user.branch._id || req.user.branch) : vehicle.branch;
    } else {
      branch = branchId || vehicle.branch;
    }

    const organization = req.user.organization ? (req.user.organization._id || req.user.organization) : vehicle.organization;

    const job = new MaintenanceJob({
      jobNumber,
      vehicle: vehicleId,
      branch,
      organization,
      type,
      priority: priority || 'Medium',
      scheduledDate,
      scheduledOdometer: vehicle.currentOdometer,
      estimatedCost: estimatedCost ? Number(estimatedCost) : 0,
      serviceProvider: serviceProvider || '',
      workDescription,
      partsReplaced: partsReplaced || [],
      createdFromIncident: incidentId || null,
      status: 'Scheduled'
    });

    await job.save();

    // Mark vehicle as Maintenance if scheduled for today or starting immediately
    if (new Date(scheduledDate) <= new Date()) {
      vehicle.status = 'Maintenance';
      await vehicle.save();
    }

    const populated = await MaintenanceJob.findById(job._id)
      .populate('vehicle')
      .populate('branch');

    await logAuditAction({
      action: 'CREATE_MAINTENANCE_JOB',
      user: req.user,
      details: `Created maintenance job ${job.jobNumber} for vehicle ${vehicle.plateNumber}`,
      branch,
      organization
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update maintenance job status & details with completion field validation
// @route PUT /api/maintenance/:id
const updateMaintenanceJob = async (req, res) => {
  try {
    const { status, actualCost, completedDate, completedOdometer, workDescription, partsReplaced, performedBy, serviceProvider } = req.body;
    const job = await MaintenanceJob.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Maintenance job not found' });

    if (!canAccessTenant(req.user, job.organization)) {
      return res.status(403).json({ message: 'Access denied: Cross-organization modification forbidden' });
    }
    if (!canAccessBranch(req.user, job.branch)) {
      return res.status(403).json({ message: 'Access denied: Maintenance job belongs to another branch' });
    }

    const vehicle = await Vehicle.findById(job.vehicle);

    // BUSINESS RULE: Required fields must exist before completing maintenance
    if (status === 'Completed') {
      if (actualCost === undefined || actualCost === null || isNaN(Number(actualCost)) || Number(actualCost) < 0) {
        return res.status(400).json({ message: 'Actual cost (positive numeric value) is required to complete maintenance' });
      }

      const executor = performedBy || serviceProvider || job.performedBy || job.serviceProvider;
      if (!executor || executor.trim().length === 0) {
        return res.status(400).json({ message: 'Technician/Service Provider name is required to complete maintenance' });
      }

      const finalOdo = completedOdometer !== undefined && completedOdometer !== null
        ? Number(completedOdometer)
        : (vehicle ? vehicle.currentOdometer : job.scheduledOdometer);

      if (vehicle && finalOdo < vehicle.currentOdometer) {
        return res.status(400).json({
          message: `Completed odometer reading (${finalOdo} km) cannot be lower than current vehicle odometer (${vehicle.currentOdometer} km)`
        });
      }

      job.completedDate = completedDate || new Date();
      job.completedOdometer = finalOdo;
      job.actualCost = Number(actualCost);
      job.performedBy = executor;

      // Update vehicle service history and set status back to Available
      if (vehicle) {
        vehicle.status = 'Available';
        vehicle.currentOdometer = Math.max(vehicle.currentOdometer, finalOdo);
        vehicle.lastServiceDate = job.completedDate;
        vehicle.lastServiceOdometer = finalOdo;
        vehicle.isOverdueForService = false;
        await vehicle.save();
      }
    } else if (status === 'In Progress') {
      if (vehicle) {
        vehicle.status = 'Maintenance';
        await vehicle.save();
      }
    } else if (status === 'Cancelled') {
      if (vehicle && vehicle.status === 'Maintenance') {
        vehicle.status = 'Available';
        await vehicle.save();
      }
    }

    if (status) job.status = status;
    if (actualCost !== undefined && status !== 'Completed') job.actualCost = Number(actualCost);
    if (workDescription) job.workDescription = workDescription;
    if (partsReplaced) job.partsReplaced = partsReplaced;
    if (performedBy) job.performedBy = performedBy;
    if (serviceProvider) job.serviceProvider = serviceProvider;

    await job.save();

    const updated = await MaintenanceJob.findById(job._id)
      .populate('vehicle')
      .populate('branch');

    await logAuditAction({
      action: 'UPDATE_MAINTENANCE_JOB',
      user: req.user,
      details: `Updated maintenance job ${job.jobNumber} status to '${job.status}'`,
      branch: job.branch,
      organization: job.organization
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getMaintenanceJobs,
  createMaintenanceJob,
  updateMaintenanceJob
};
