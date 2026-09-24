const FuelEntry = require('../models/FuelEntry');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const logAuditAction = require('../utils/auditLogger');

// @desc Get fuel entries with filtering & branch scoping
// @route GET /api/fuel
const getFuelEntries = async (req, res) => {
  try {
    let query = { ...req.branchFilter };
    if (req.query.vehicleId) query.vehicle = req.query.vehicleId;
    if (req.query.driverId) query.driver = req.query.driverId;

    if (req.user.role === 'Driver') {
      const driverRecord = await Driver.findOne({ user: req.user._id });
      if (driverRecord) query.driver = driverRecord._id;
    }

    const entries = await FuelEntry.find(query)
      .populate('vehicle', 'plateNumber make model type fuelType')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name email' } })
      .populate('trip', 'tripNumber origin destination')
      .populate('branch', 'name code')
      .sort({ date: -1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create Fuel Entry
// @route POST /api/fuel
const createFuelEntry = async (req, res) => {
  try {
    const { vehicleId, driverId, tripId, date, odometerReading, fuelVolumeLiters, unitPrice, totalCost, fuelStation, isFullTank, receiptNumber } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    let finalDriverId = driverId;
    if (!finalDriverId && req.user.role === 'Driver') {
      const dRecord = await Driver.findOne({ user: req.user._id });
      if (dRecord) finalDriverId = dRecord._id;
    }

    const calculatedTotal = totalCost || (fuelVolumeLiters * unitPrice);

    // Calculate fuel efficiency if previous entry exists
    const lastEntry = await FuelEntry.findOne({ vehicle: vehicleId }).sort({ odometerReading: -1 });
    let calculatedEfficiency = null;
    if (lastEntry && odometerReading > lastEntry.odometerReading && fuelVolumeLiters > 0) {
      const distance = odometerReading - lastEntry.odometerReading;
      calculatedEfficiency = Number((distance / fuelVolumeLiters).toFixed(2));
    }

    const entry = new FuelEntry({
      vehicle: vehicleId,
      driver: finalDriverId,
      trip: tripId || null,
      branch: vehicle.branch,
      date: date || new Date(),
      odometerReading,
      fuelVolumeLiters,
      unitPrice,
      totalCost: calculatedTotal,
      fuelStation,
      isFullTank: isFullTank !== undefined ? isFullTank : true,
      receiptNumber,
      calculatedEfficiencyKmPerL: calculatedEfficiency
    });

    await entry.save();

    // Update vehicle odometer if higher
    if (odometerReading > vehicle.currentOdometer) {
      vehicle.currentOdometer = odometerReading;
      await vehicle.save();
    }

    const populated = await FuelEntry.findById(entry._id)
      .populate('vehicle')
      .populate({ path: 'driver', populate: { path: 'user' } })
      .populate('branch');

    await logAuditAction({
      action: 'CREATE_FUEL_ENTRY',
      user: req.user,
      details: `Logged ${fuelVolumeLiters}L fuel for vehicle ${vehicle.plateNumber} ($${calculatedTotal})`,
      branch: vehicle.branch
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
