const Vehicle = require('../models/Vehicle');
const logAuditAction = require('../utils/auditLogger');
const { canAccessBranch, canAccessTenant } = require('../middleware/authMiddleware');

// @desc Get vehicles with filtering, branch-scoping, and pagination
// @route GET /api/vehicles
const getVehicles = async (req, res) => {
  try {
    const { status, type, search, page, limit } = req.query;
    let query = { ...req.branchFilter };

    if (status && status !== 'ALL') query.status = status;
    if (type && type !== 'ALL') query.type = type;
    if (search) {
      query.$or = [
        { plateNumber: { $regex: search, $options: 'i' } },
        { vin: { $regex: search, $options: 'i' } },
        { make: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Vehicle.countDocuments(query);
    res.set('X-Total-Count', total);

    let queryBuilder = Vehicle.find(query).populate('branch').sort({ createdAt: -1 });

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      queryBuilder = queryBuilder.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const vehicles = await queryBuilder;

    if (req.query.paginated === 'true') {
      const limitNum = parseInt(limit, 10) || 10;
      return res.json({
        data: vehicles,
        pagination: {
          total,
          page: parseInt(page, 10) || 1,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get vehicle by ID with tenant & branch security
// @route GET /api/vehicles/:id
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('branch');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // Multi-tenant & branch isolation check
    if (!canAccessTenant(req.user, vehicle.organization)) {
      return res.status(403).json({ message: 'Access denied: Cross-organization access forbidden' });
    }
    if (!canAccessBranch(req.user, vehicle.branch)) {
      return res.status(403).json({ message: 'Access denied: Vehicle belongs to another branch' });
    }

    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create new vehicle with tenant and branch authorization
// @route POST /api/vehicles
const createVehicle = async (req, res) => {
  try {
    const { vin, plateNumber, make, model, year, type, fuelType, fuelCapacity, currentOdometer, branch } = req.body;

    const existingPlate = await Vehicle.findOne({ plateNumber: plateNumber.toUpperCase() });
    if (existingPlate) {
      return res.status(400).json({ message: `Vehicle with plate '${plateNumber}' already exists` });
    }

    // Branch Managers can ONLY create vehicles in their own assigned branch
    let targetBranch;
    if (req.user.role === 'Branch Manager') {
      targetBranch = req.user.branch ? (req.user.branch._id || req.user.branch) : null;
    } else {
      targetBranch = branch || (req.user.branch ? (req.user.branch._id || req.user.branch) : null);
    }

    if (!targetBranch) {
      const Branch = require('../models/Branch');
      const defaultBranch = await Branch.findOne(req.user.organization ? { organization: req.user.organization._id || req.user.organization } : {});
      if (defaultBranch) targetBranch = defaultBranch._id;
    }

    if (!targetBranch) {
      return res.status(400).json({ message: 'Branch ID is required for vehicle creation' });
    }

    const organization = req.user.organization ? (req.user.organization._id || req.user.organization) : null;

    const vehicle = new Vehicle({
      vin: vin.toUpperCase(),
      plateNumber: plateNumber.toUpperCase(),
      make,
      model,
      year,
      type,
      fuelType,
      fuelCapacity,
      currentOdometer: currentOdometer || 0,
      branch: targetBranch,
      organization,
      lastServiceOdometer: currentOdometer || 0,
      lastServiceDate: new Date()
    });

    await vehicle.save();
    const populated = await Vehicle.findById(vehicle._id).populate('branch');

    await logAuditAction({
      action: 'CREATE_VEHICLE',
      user: req.user,
      details: `Created vehicle ${vehicle.plateNumber} (${vehicle.make} ${vehicle.model})`,
      branch: targetBranch,
      organization
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update vehicle details with isolation check
// @route PUT /api/vehicles/:id
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    if (!canAccessTenant(req.user, vehicle.organization)) {
      return res.status(403).json({ message: 'Access denied: Cross-organization modification forbidden' });
    }
    if (!canAccessBranch(req.user, vehicle.branch)) {
      return res.status(403).json({ message: 'Access denied: Vehicle belongs to another branch' });
    }

    // Prevent Branch Manager from reassigning vehicle to another branch
    if (req.user.role === 'Branch Manager' && req.body.branch) {
      const userBranchId = (req.user.branch?._id || req.user.branch).toString();
      if (req.body.branch.toString() !== userBranchId) {
        return res.status(403).json({ message: 'Branch Managers cannot reassign vehicles to external branches' });
      }
    }

    Object.assign(vehicle, req.body);
    await vehicle.save();

    const updated = await Vehicle.findById(vehicle._id).populate('branch');

    await logAuditAction({
      action: 'UPDATE_VEHICLE',
      user: req.user,
      details: `Updated vehicle details for ${vehicle.plateNumber}`,
      branch: vehicle.branch,
      organization: vehicle.organization
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

    if (!canAccessTenant(req.user, vehicle.organization)) {
      return res.status(403).json({ message: 'Access denied: Cross-organization modification forbidden' });
    }
    if (!canAccessBranch(req.user, vehicle.branch)) {
      return res.status(403).json({ message: 'Access denied: Vehicle belongs to another branch' });
    }

    const validStatuses = ['Available', 'In Transit', 'Maintenance', 'Out of Service'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid vehicle status. Must be one of: ${validStatuses.join(', ')}` });
    }

    vehicle.status = status;
    await vehicle.save();

    await logAuditAction({
      action: 'UPDATE_VEHICLE_STATUS',
      user: req.user,
      details: `Changed vehicle ${vehicle.plateNumber} status to '${status}'`,
      branch: vehicle.branch,
      organization: vehicle.organization
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
