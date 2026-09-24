const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const { checkVehicleAvailability, checkDriverAvailability } = require('../utils/availabilityEngine');
const logAuditAction = require('../utils/auditLogger');

// @desc Get trips list with filtering & branch scoping
// @route GET /api/trips
const getTrips = async (req, res) => {
  try {
    const { status, search, driverId } = req.query;
    let query = { ...req.branchFilter };

    if (status) query.status = status;
    if (driverId) query.driver = driverId;
    if (req.user.role === 'Driver') {
      const driverRecord = await Driver.findOne({ user: req.user._id });
      if (driverRecord) {
        query.driver = driverRecord._id;
      }
    }

    if (search) {
      query.$or = [
        { tripNumber: { $regex: search, $options: 'i' } },
        { origin: { $regex: search, $options: 'i' } },
        { destination: { $regex: search, $options: 'i' } },
        { cargoDetails: { $regex: search, $options: 'i' } }
      ];
    }

    const trips = await Trip.find(query)
      .populate('vehicle', 'plateNumber make model type currentOdometer')
      .populate({
        path: 'driver',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate('branch', 'name code city')
      .sort({ createdAt: -1 });

    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get trip details by ID
// @route GET /api/trips/:id
const getTripById = async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('vehicle')
      .populate({
        path: 'driver',
        populate: { path: 'user', select: 'name email phone avatar' }
      })
      .populate('branch')
      .populate('statusHistory.updatedBy', 'name role');

    if (!trip) return res.status(404).json({ message: 'Trip not found' });
    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create new Trip with Availability Engine Check
// @route POST /api/trips
const createTrip = async (req, res) => {
  try {
    const {
      origin,
      destination,
      estimatedDistanceKm,
      plannedDepartureTime,
      plannedArrivalTime,
      vehicleId,
      driverId,
      branchId,
      cargoDetails,
      cargoWeightKg
    } = req.body;

    const branch = branchId || (req.user.branch ? (req.user.branch._id || req.user.branch) : null);

    // Run Availability Engine Check for Vehicle
    const vCheck = await checkVehicleAvailability(vehicleId, plannedDepartureTime, plannedArrivalTime);
    if (!vCheck.available) {
      return res.status(400).json({ message: `Vehicle Conflict: ${vCheck.reason}` });
    }

    // Run Availability Engine Check for Driver
    const dCheck = await checkDriverAvailability(driverId, plannedDepartureTime, plannedArrivalTime);
    if (!dCheck.available) {
      return res.status(400).json({ message: `Driver Conflict: ${dCheck.reason}` });
    }

    const count = await Trip.countDocuments();
    const tripNumber = `TRP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const vehicle = vCheck.vehicle;

    const trip = new Trip({
      tripNumber,
      origin,
      destination,
      estimatedDistanceKm,
      plannedDepartureTime,
      plannedArrivalTime,
      vehicle: vehicleId,
      driver: driverId,
      branch,
      cargoDetails,
      cargoWeightKg,
      status: 'Assigned',
      startOdometer: vehicle.currentOdometer,
      statusHistory: [
        {
          status: 'Assigned',
          timestamp: new Date(),
          updatedBy: req.user._id,
          notes: 'Trip planned and vehicle/driver assigned successfully'
        }
      ]
    });

    await trip.save();

    // Lock driver & vehicle statuses to On Duty & In Transit if starting immediately or assigned
    await Driver.findByIdAndUpdate(driverId, { status: 'On Duty', assignedVehicle: vehicleId });

    const populated = await Trip.findById(trip._id)
      .populate('vehicle')
      .populate({ path: 'driver', populate: { path: 'user' } })
      .populate('branch');

    await logAuditAction({
      action: 'CREATE_TRIP',
      user: req.user,
      details: `Created trip ${trip.tripNumber} (${origin} -> ${destination})`,
      branch
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update trip status (Lifecycle engine)
// @route PATCH /api/trips/:id/status
const updateTripStatus = async (req, res) => {
  try {
    const { status, notes, location, delayReason, endOdometer, actualDistanceKm } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    const validStatuses = ['Planned', 'Assigned', 'Started', 'Delayed', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid trip status' });
    }

    trip.status = status;
    if (delayReason) trip.delayReason = delayReason;

    if (status === 'Started' && !trip.actualDepartureTime) {
      trip.actualDepartureTime = new Date();
      await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'In Transit' });
    }

    if (status === 'Completed') {
      trip.actualArrivalTime = new Date();
      const finalEndOdo = endOdometer || (trip.startOdometer + (actualDistanceKm || trip.estimatedDistanceKm));
      trip.endOdometer = finalEndOdo;
      trip.actualDistanceKm = actualDistanceKm || (finalEndOdo - trip.startOdometer);

      // Update Vehicle Odometer & status to Available
      await Vehicle.findByIdAndUpdate(trip.vehicle, {
        currentOdometer: finalEndOdo,
        status: 'Available'
      });

      // Update Driver status & stats
      const driver = await Driver.findById(trip.driver);
      if (driver) {
        driver.status = 'Available';
        driver.totalTripsCompleted += 1;
        driver.totalDistanceDrivenKm += (trip.actualDistanceKm || trip.estimatedDistanceKm);
        await driver.save();
      }
    }

    if (status === 'Cancelled') {
      await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'Available' });
      await Driver.findByIdAndUpdate(trip.driver, { status: 'Available' });
    }

    trip.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: req.user._id,
      notes: notes || `Trip status updated to ${status}`,
      location
    });

    await trip.save();

    const updated = await Trip.findById(trip._id)
      .populate('vehicle')
      .populate({ path: 'driver', populate: { path: 'user' } })
      .populate('branch');

    await logAuditAction({
      action: 'UPDATE_TRIP_STATUS',
      user: req.user,
      details: `Trip ${trip.tripNumber} status changed to ${status}`,
      branch: trip.branch
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTrips,
  getTripById,
  createTrip,
  updateTripStatus
};
