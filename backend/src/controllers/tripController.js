const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const { checkVehicleAvailability, checkDriverAvailability } = require('../utils/availabilityEngine');
const logAuditAction = require('../utils/auditLogger');
const { canAccessBranch, canAccessTenant } = require('../middleware/authMiddleware');

// @desc Get trips list with filtering, branch scoping & pagination
// @route GET /api/trips
const getTrips = async (req, res) => {
  try {
    const { status, search, driverId, page, limit } = req.query;
    let query = { ...req.branchFilter };

    if (status && status !== 'ALL') query.status = status;
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

    const total = await Trip.countDocuments(query);
    res.set('X-Total-Count', total);

    let queryBuilder = Trip.find(query)
      .populate('vehicle', 'plateNumber make model type currentOdometer fuelType')
      .populate({
        path: 'driver',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate('branch', 'name code city')
      .sort({ createdAt: -1 });

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      queryBuilder = queryBuilder.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const trips = await queryBuilder;

    if (req.query.paginated === 'true') {
      const limitNum = parseInt(limit, 10) || 10;
      return res.json({
        data: trips,
        pagination: {
          total,
          page: parseInt(page, 10) || 1,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    res.json(trips);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get trip details by ID with access verification
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

    // Isolation check
    if (!canAccessTenant(req.user, trip.organization)) {
      return res.status(403).json({ message: 'Access denied: Cross-organization trip access forbidden' });
    }
    if (!canAccessBranch(req.user, trip.branch)) {
      return res.status(403).json({ message: 'Access denied: Trip belongs to another branch' });
    }

    // Driver self-access check
    if (req.user.role === 'Driver') {
      const driverRecord = await Driver.findOne({ user: req.user._id });
      if (driverRecord && trip.driver?._id.toString() !== driverRecord._id.toString()) {
        return res.status(403).json({ message: 'Drivers may only view their own assigned trips' });
      }
    }

    res.json(trip);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create new Trip with Availability Engine Check & Tenancy
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

    if (!origin || !destination || !plannedDepartureTime || !plannedArrivalTime) {
      return res.status(400).json({ message: 'Origin, destination, planned departure and arrival times are required' });
    }

    if (!vehicleId || !driverId) {
      return res.status(400).json({ message: 'Both vehicle and driver assignments are mandatory to create a trip' });
    }

    // Branch assignment security
    let branch;
    if (req.user.role === 'Branch Manager') {
      branch = req.user.branch ? (req.user.branch._id || req.user.branch) : null;
    } else {
      branch = branchId || (req.user.branch ? (req.user.branch._id || req.user.branch) : null);
    }

    if (!branch) {
      return res.status(400).json({ message: 'Branch ID is required for trip creation' });
    }

    // Availability Engine Check for Vehicle
    const vCheck = await checkVehicleAvailability(vehicleId, plannedDepartureTime, plannedArrivalTime);
    if (!vCheck.available) {
      return res.status(400).json({ message: `Vehicle Conflict: ${vCheck.reason}` });
    }

    // Availability Engine Check for Driver
    const dCheck = await checkDriverAvailability(driverId, plannedDepartureTime, plannedArrivalTime);
    if (!dCheck.available) {
      return res.status(400).json({ message: `Driver Conflict: ${dCheck.reason}` });
    }

    const vehicle = vCheck.vehicle;
    const organization = req.user.organization ? (req.user.organization._id || req.user.organization) : null;

    const count = await Trip.countDocuments();
    const tripNumber = `TRP-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    const trip = new Trip({
      tripNumber,
      origin,
      destination,
      estimatedDistanceKm: Number(estimatedDistanceKm) || 100,
      plannedDepartureTime,
      plannedArrivalTime,
      vehicle: vehicleId,
      driver: driverId,
      branch,
      organization,
      cargoDetails,
      cargoWeightKg: cargoWeightKg ? Number(cargoWeightKg) : 0,
      status: 'Assigned',
      startOdometer: vehicle.currentOdometer || 0,
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

    // Lock driver & vehicle statuses
    await Driver.findByIdAndUpdate(driverId, { status: 'On Duty', assignedVehicle: vehicleId });

    const populated = await Trip.findById(trip._id)
      .populate('vehicle')
      .populate({ path: 'driver', populate: { path: 'user' } })
      .populate('branch');

    await logAuditAction({
      action: 'CREATE_TRIP',
      user: req.user,
      details: `Created trip ${trip.tripNumber} (${origin} -> ${destination})`,
      branch,
      organization
    });

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update trip status (Strict Lifecycle & State Machine Engine)
// @route PATCH /api/trips/:id/status
const updateTripStatus = async (req, res) => {
  try {
    const { status, notes, location, delayReason, endOdometer, actualDistanceKm } = req.body;
    const trip = await Trip.findById(req.params.id);
    if (!trip) return res.status(404).json({ message: 'Trip not found' });

    // Isolation check
    if (!canAccessTenant(req.user, trip.organization)) {
      return res.status(403).json({ message: 'Access denied: Cross-organization trip modification forbidden' });
    }
    if (!canAccessBranch(req.user, trip.branch)) {
      return res.status(403).json({ message: 'Access denied: Trip belongs to another branch' });
    }

    // Driver self-access check
    if (req.user.role === 'Driver') {
      const driverRecord = await Driver.findOne({ user: req.user._id });
      if (!driverRecord || trip.driver.toString() !== driverRecord._id.toString()) {
        return res.status(403).json({ message: 'Drivers can only update their own assigned trips' });
      }
    }

    const validStatuses = ['Planned', 'Assigned', 'Started', 'Delayed', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid trip status. Must be one of: ${validStatuses.join(', ')}` });
    }

    // BUSINESS RULE 1: Completed trips cannot restart or transition
    if (trip.status === 'Completed') {
      return res.status(400).json({ message: 'Completed trips cannot restart or be modified' });
    }

    // BUSINESS RULE 2: Cancelled trips cannot start or transition
    if (trip.status === 'Cancelled') {
      return res.status(400).json({ message: 'Cancelled trips cannot be started or reactivated' });
    }

    // BUSINESS RULE 3: Cannot start without vehicle & driver
    if (status === 'Started' && (!trip.vehicle || !trip.driver)) {
      return res.status(400).json({ message: 'Trip cannot start without a vehicle and driver assigned' });
    }

    // BUSINESS RULE 4: Vehicle under maintenance cannot start trips
    if (status === 'Started') {
      const activeVehicle = await Vehicle.findById(trip.vehicle);
      if (activeVehicle) {
        if (activeVehicle.status === 'Maintenance') {
          return res.status(400).json({ message: `Vehicle ${activeVehicle.plateNumber} is currently under maintenance and cannot start a trip` });
        }
        if (activeVehicle.status === 'Out of Service') {
          return res.status(400).json({ message: `Vehicle ${activeVehicle.plateNumber} is marked Out of Service and cannot start a trip` });
        }
      }
    }

    // BUSINESS RULE 5: End odometer cannot be lower than start odometer
    if (status === 'Completed' && endOdometer !== undefined && endOdometer !== null) {
      const numEndOdo = Number(endOdometer);
      if (isNaN(numEndOdo) || numEndOdo < trip.startOdometer) {
        return res.status(400).json({
          message: `End odometer (${numEndOdo} km) cannot be lower than trip start odometer (${trip.startOdometer} km)`
        });
      }
    }

    // Status transition executions
    trip.status = status;
    if (delayReason) trip.delayReason = delayReason;

    if (status === 'Started' && !trip.actualDepartureTime) {
      trip.actualDepartureTime = new Date();
      await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'In Transit' });
    }

    if (status === 'Completed') {
      trip.actualArrivalTime = new Date();
      const finalEndOdo = endOdometer !== undefined && endOdometer !== null && !isNaN(Number(endOdometer))
        ? Number(endOdometer)
        : (trip.startOdometer + (actualDistanceKm ? Number(actualDistanceKm) : trip.estimatedDistanceKm));

      trip.endOdometer = finalEndOdo;
      trip.actualDistanceKm = actualDistanceKm ? Number(actualDistanceKm) : (finalEndOdo - trip.startOdometer);

      // Update Vehicle Odometer & release status to Available
      await Vehicle.findByIdAndUpdate(trip.vehicle, {
        currentOdometer: finalEndOdo,
        status: 'Available'
      });

      // Update Driver status & cumulative stats
      const driver = await Driver.findById(trip.driver);
      if (driver) {
        driver.status = 'Available';
        driver.assignedVehicle = null;
        driver.totalTripsCompleted = (driver.totalTripsCompleted || 0) + 1;
        driver.totalDistanceDrivenKm = (driver.totalDistanceDrivenKm || 0) + (trip.actualDistanceKm || trip.estimatedDistanceKm);
        await driver.save();
      }
    }

    if (status === 'Cancelled') {
      await Vehicle.findByIdAndUpdate(trip.vehicle, { status: 'Available' });
      await Driver.findByIdAndUpdate(trip.driver, { status: 'Available', assignedVehicle: null });
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
      branch: trip.branch,
      organization: trip.organization
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
