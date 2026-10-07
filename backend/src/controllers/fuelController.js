const FuelEntry = require('../models/FuelEntry');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const logAuditAction = require('../utils/auditLogger');
const { canAccessBranch, canAccessTenant } = require('../middleware/authMiddleware');

// @desc Get fuel entries with filtering, branch scoping & pagination
// @route GET /api/fuel
const getFuelEntries = async (req, res) => {
  try {
    const { vehicleId, driverId, page, limit } = req.query;
    let query = { ...req.branchFilter };

    if (vehicleId) query.vehicle = vehicleId;
    if (driverId) query.driver = driverId;

    if (req.user.role === 'Driver') {
      const driverRecord = await Driver.findOne({ user: req.user._id });
      if (driverRecord) query.driver = driverRecord._id;
    }

    const total = await FuelEntry.countDocuments(query);
    res.set('X-Total-Count', total);

    let queryBuilder = FuelEntry.find(query)
      .populate('vehicle', 'plateNumber make model type fuelType currentOdometer')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name email' } })
      .populate('trip', 'tripNumber origin destination')
      .populate('branch', 'name code city')
      .sort({ date: -1 });

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      queryBuilder = queryBuilder.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const entries = await queryBuilder;

    if (req.query.paginated === 'true') {
      const limitNum = parseInt(limit, 10) || 10;
      return res.json({
        data: entries,
        pagination: {
          total,
          page: parseInt(page, 10) || 1,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create Fuel Entry with strict odometer mileage validation
// @route POST /api/fuel
const createFuelEntry = async (req, res) => {
  try {
    const {
      vehicleId,
      driverId,
      tripId,
      date,
      odometerReading,
      fuelVolumeLiters,
      unitPrice,
      totalCost,
      fuelStation,
      isFullTank,
      receiptNumber
    } = req.body;

    const targetVehicleId = req.body.vehicleId || req.body.vehicle;
    const targetOdometer = req.body.odometerReading !== undefined ? Number(req.body.odometerReading) : undefined;
    const targetLiters = req.body.fuelVolumeLiters !== undefined ? Number(req.body.fuelVolumeLiters) : (req.body.liters !== undefined ? Number(req.body.liters) : undefined);
    const targetPrice = req.body.unitPrice !== undefined ? Number(req.body.unitPrice) : (req.body.cost && targetLiters ? Number(req.body.cost) / targetLiters : undefined);

    if (!targetVehicleId || targetOdometer === undefined || !targetLiters || !targetPrice) {
      return res.status(400).json({ message: 'Vehicle, odometer reading, fuel volume, and unit price are required' });
    }

    const vehicle = await Vehicle.findById(targetVehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    // Isolation check
    if (!canAccessTenant(req.user, vehicle.organization)) {
      return res.status(403).json({ message: 'Access denied: Cross-organization fueling forbidden' });
    }
    if (!canAccessBranch(req.user, vehicle.branch)) {
      return res.status(403).json({ message: 'Access denied: Vehicle belongs to another branch' });
    }

    const numOdometer = Number(targetOdometer);
    const numVolume = Number(targetLiters);
    const numPrice = Number(targetPrice);

    if (isNaN(numOdometer) || numOdometer < 0) {
      return res.status(400).json({ message: 'Valid positive odometer reading is required' });
    }

    // BUSINESS RULE: Fuel odometer cannot violate mileage history
    if (numOdometer < vehicle.currentOdometer) {
      return res.status(400).json({
        message: `Odometer reading (${numOdometer.toLocaleString()} km) cannot be lower than current vehicle odometer (${vehicle.currentOdometer.toLocaleString()} km)`
      });
    }

    let finalDriverId = driverId;
    if (!finalDriverId && req.user.role === 'Driver') {
      const dRecord = await Driver.findOne({ user: req.user._id });
      if (dRecord) finalDriverId = dRecord._id;
    }

    const calculatedTotal = totalCost ? Number(totalCost) : Number((numVolume * numPrice).toFixed(2));

    // Calculate fuel efficiency if previous entry exists
    const lastEntry = await FuelEntry.findOne({ vehicle: targetVehicleId }).sort({ odometerReading: -1 });
    let calculatedEfficiency = null;
    if (lastEntry && numOdometer > lastEntry.odometerReading && numVolume > 0) {
      const distance = numOdometer - lastEntry.odometerReading;
      calculatedEfficiency = Number((distance / numVolume).toFixed(2));
    }

    const organization = req.user.organization ? (req.user.organization._id || req.user.organization) : vehicle.organization;

    const entry = new FuelEntry({
      vehicle: targetVehicleId,
      driver: finalDriverId,
      trip: tripId || null,
      branch: vehicle.branch,
      organization,
      date: date || new Date(),
      odometerReading: numOdometer,
      fuelVolumeLiters: numVolume,
      unitPrice: numPrice,
      totalCost: calculatedTotal,
      fuelStation,
      isFullTank: isFullTank !== undefined ? isFullTank : true,
      receiptNumber,
      calculatedEfficiencyKmPerL: calculatedEfficiency
    });

    await entry.save();

    // Update vehicle odometer if higher
    if (numOdometer > vehicle.currentOdometer) {
      vehicle.currentOdometer = numOdometer;
      await vehicle.save();
    }

    const populated = await FuelEntry.findById(entry._id)
      .populate('vehicle')
      .populate({ path: 'driver', populate: { path: 'user' } })
      .populate('branch');

    await logAuditAction({
      action: 'CREATE_FUEL_ENTRY',
      user: req.user,
      details: `Logged ${numVolume}L fuel for vehicle ${vehicle.plateNumber} ($${calculatedTotal}) at ${numOdometer} km`,
      branch: vehicle.branch,
      organization
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getFuelEntries,
  createFuelEntry
};
