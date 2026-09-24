const MaintenanceJob = require('../models/MaintenanceJob');
const Vehicle = require('../models/Vehicle');
const logAuditAction = require('../utils/auditLogger');

// @desc Get maintenance jobs
// @route GET /api/maintenance
const getMaintenanceJobs = async (req, res) => {
  try {
    const { status, type, priority } = req.query;
    let query = { ...req.branchFilter };

    if (status) query.status = status;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const jobs = await MaintenanceJob.find(query)
      .populate('vehicle', 'plateNumber make model currentOdometer status')
      .populate('branch', 'name code')
      .populate('createdFromIncident')
      .sort({ scheduledDate: -1 });

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

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const count = await MaintenanceJob.countDocuments();
    const jobNumber = `MAINT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const branch = branchId || vehicle.branch;

    const job = new MaintenanceJob({
      jobNumber,
      vehicle: vehicleId,
      branch,
      type,
      priority: priority || 'Medium',
      scheduledDate,
      scheduledOdometer: vehicle.currentOdometer,
      estimatedCost,
      serviceProvider,
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
      branch
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update maintenance job status & details
// @route PUT /api/maintenance/:id
const updateMaintenanceJob = async (req, res) => {
  try {
    const { status, actualCost, completedDate, completedOdometer, workDescription, partsReplaced, performedBy } = req.body;
    const job = await MaintenanceJob.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Maintenance job not found' });

    if (status) job.status = status;
    if (actualCost !== undefined) job.actualCost = actualCost;
    if (workDescription) job.workDescription = workDescription;
    if (partsReplaced) job.partsReplaced = partsReplaced;
    if (performedBy) job.performedBy = performedBy;

    if (status === 'Completed') {
      job.completedDate = completedDate || new Date();
      job.completedOdometer = completedOdometer || job.scheduledOdometer;

      // Update vehicle service history and set status back to Available
      const vehicle = await Vehicle.findById(job.vehicle);
      if (vehicle) {
        vehicle.status = 'Available';
        vehicle.lastServiceDate = job.completedDate;
        vehicle.lastServiceOdometer = job.completedOdometer;
        vehicle.isOverdueForService = false;
        await vehicle.save();
      }
    } else if (status === 'In Progress') {
      await Vehicle.findByIdAndUpdate(job.vehicle, { status: 'Maintenance' });
    } else if (status === 'Cancelled') {
      await Vehicle.findByIdAndUpdate(job.vehicle, { status: 'Available' });
    }

    await job.save();

    const updated = await MaintenanceJob.findById(job._id)
      .populate('vehicle')
      .populate('branch');

    await logAuditAction({
      action: 'UPDATE_MAINTENANCE_JOB',
      user: req.user,
      details: `Updated maintenance job ${job.jobNumber} status to '${job.status}'`,
      branch: job.branch
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
