const Vehicle = require('../models/Vehicle');
const logAuditAction = require('../utils/auditLogger');

// @desc Get vehicles with filtering, branch-scoping, and pagination
// @route GET /api/vehicles
const getVehicles = async (req, res) => {
  try {
    const { status, type, search } = req.query;
    let query = { ...req.branchFilter };

    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { plateNumber: { $regex: search, $options: 'i' } },
        { vin: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    const vehicles = await Vehicle.find(query).populate('branch').sort({ createdAt: -1 });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get vehicle by ID
// @route GET /api/vehicles/:id
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('branch');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create new vehicle
// @route POST /api/vehicles
const createVehicle = async (req, res) => {
  try {
    const { vin, plateNumber, make, model, year, type, fuelType, fuelCapacity, currentOdometer, branch } = req.body;

    const existingPlate = await Vehicle.findOne({ plateNumber: plateNumber.toUpperCase() });
    if (existingPlate) {
      return res.status(400).json({ message: `Vehicle with plate '${plateNumber}' already exists` });
    }

    const targetBranch = branch || (req.user.branch ? (req.user.branch._id || req.user.branch) : null);
    if (!targetBranch) {
      return res.status(400).json({ message: 'Branch ID is required for vehicle creation' });
    }

    const vehicle = new Vehicle({
      vin: vin.toUpperCase(),
      plateNumber: plateNumber.toUpperCase(),
      make,
      model,
      year,
      type,
      fuelType,
      fuelCapacity,
      currentOdometer,
      branch: targetBranch,
      lastServiceOdometer: currentOdometer || 0,
      lastServiceDate: new Date()
    });

    await vehicle.save();
    const populated = await Vehicle.findById(vehicle._id).populate('branch');

    await logAuditAction({
      action: 'CREATE_VEHICLE',
      user: req.user,
      details: `Created vehicle ${vehicle.plateNumber} (${vehicle.make} ${vehicle.model})`,
      branch: targetBranch
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update vehicle
// @route PUT /api/vehicles/:id
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    Object.assign(vehicle, req.body);
    await vehicle.save();

    const updated = await Vehicle.findById(vehicle._id).populate('branch');

    await logAuditAction({
      action: 'UPDATE_VEHICLE',
      user: req.user,
      details: `Updated vehicle details for ${vehicle.plateNumber}`,
      branch: vehicle.branch
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update vehicle status (Available, Maintenance, Out of Service)
// @route PATCH /api/vehicles/:id/status
const updateVehicleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    vehicle.status = status;
    await vehicle.save();

    await logAuditAction({
      action: 'UPDATE_VEHICLE_STATUS',
      user: req.user,
      details: `Changed vehicle ${vehicle.plateNumber} status to '${status}'`,
      branch: vehicle.branch
    });

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  updateVehicleStatus
};
