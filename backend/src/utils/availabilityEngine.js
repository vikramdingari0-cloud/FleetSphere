const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const MaintenanceJob = require('../models/MaintenanceJob');
const Document = require('../models/Document');

/**
 * Checks if a vehicle is available for a trip during the requested timeframe.
 * Enforces status, maintenance jobs, service intervals, document compliance, and trip conflicts.
 */
const checkVehicleAvailability = async (vehicleId, plannedDeparture, plannedArrival, excludeTripId = null) => {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    return { available: false, reason: 'Vehicle not found' };
  }

  if (vehicle.status === 'Out of Service') {
    return { available: false, reason: `Vehicle ${vehicle.plateNumber} is marked Out of Service` };
  }

  if (vehicle.status === 'Maintenance') {
    return { available: false, reason: `Vehicle ${vehicle.plateNumber} is currently undergoing maintenance` };
  }

  if (vehicle.isOverdueForService) {
    return {
      available: false,
      reason: `Vehicle ${vehicle.plateNumber} is overdue for scheduled preventative maintenance (${vehicle.currentOdometer} km / Due at ${vehicle.nextServiceDueKm || 'N/A'} km)`
    };
  }

  // Check for critical expired vehicle compliance documents (Registration, Insurance, Road Permit)
  const expiredDoc = await Document.findOne({
    vehicle: vehicleId,
    status: 'Expired',
    documentType: { $in: ['Vehicle Registration', 'Vehicle Insurance', 'Road Permit'] }
  });

  if (expiredDoc) {
    return {
      available: false,
      reason: `Vehicle ${vehicle.plateNumber} has expired compliance document: ${expiredDoc.documentType} ("${expiredDoc.title}")`
    };
  }

  // Check for active maintenance job during timeframe
  const activeMaint = await MaintenanceJob.findOne({
    vehicle: vehicleId,
    status: { $in: ['Scheduled', 'In Progress'] },
    scheduledDate: { $lte: new Date(plannedArrival) }
  });

  if (activeMaint) {
    return {
      available: false,
      reason: `Vehicle ${vehicle.plateNumber} has a maintenance job (${activeMaint.jobNumber}) scheduled/in-progress`
    };
  }

  // Check for overlapping active trips
  const query = {
    vehicle: vehicleId,
    status: { $in: ['Assigned', 'Started', 'Delayed'] },
    $or: [
      { plannedDepartureTime: { $lt: new Date(plannedArrival) }, plannedArrivalTime: { $gt: new Date(plannedDeparture) } }
    ]
  };

  if (excludeTripId) {
    query._id = { $ne: excludeTripId };
  }

  const conflictingTrip = await Trip.findOne(query);

  if (conflictingTrip) {
    return {
      available: false,
      reason: `Vehicle ${vehicle.plateNumber} is already allocated to trip ${conflictingTrip.tripNumber} during this timeframe`
    };
  }

  return { available: true, vehicle };
};

/**
 * Checks if a driver is eligible and available for a trip during the requested timeframe.
 * Enforces duty status, license expiry, medical clearance expiry, document compliance, and trip conflicts.
 */
const checkDriverAvailability = async (driverId, plannedDeparture, plannedArrival, excludeTripId = null) => {
  const driver = await Driver.findById(driverId).populate('user');
  if (!driver) {
    return { available: false, reason: 'Driver record not found' };
  }

  const driverName = driver.user ? driver.user.name : 'Unknown Driver';

  if (driver.status === 'Suspended') {
    return { available: false, reason: `Driver ${driverName} is currently suspended` };
  }

  if (driver.status === 'Off Duty') {
    return { available: false, reason: `Driver ${driverName} is off duty` };
  }

  // Check license expiry
  if (driver.licenseExpiryDate && new Date(driver.licenseExpiryDate) < new Date()) {
    return { available: false, reason: `Driver ${driverName}'s driver license has expired` };
  }

  // Check medical clearance expiry
  if (driver.medicalCertExpiryDate && new Date(driver.medicalCertExpiryDate) < new Date()) {
    return { available: false, reason: `Driver ${driverName}'s medical certificate has expired` };
  }

  // Check for expired driver compliance documents
  const expiredDriverDoc = await Document.findOne({
    driver: driverId,
    status: 'Expired',
    documentType: { $in: ['Driver License Scan', 'Medical Clearance'] }
  });

  if (expiredDriverDoc) {
    return {
      available: false,
      reason: `Driver ${driverName} has expired compliance document: ${expiredDriverDoc.documentType}`
    };
  }

  // Check for overlapping active trips
  const query = {
    driver: driverId,
    status: { $in: ['Assigned', 'Started', 'Delayed'] },
    $or: [
      { plannedDepartureTime: { $lt: new Date(plannedArrival) }, plannedArrivalTime: { $gt: new Date(plannedDeparture) } }
    ]
  };

  if (excludeTripId) {
    query._id = { $ne: excludeTripId };
  }

  const conflictingTrip = await Trip.findOne(query);

  if (conflictingTrip) {
    return {
      available: false,
      reason: `Driver ${driverName} is already assigned to trip ${conflictingTrip.tripNumber} during this timeframe`
    };
  }

  return { available: true, driver };
};

module.exports = {
  checkVehicleAvailability,
  checkDriverAvailability
};
