const Vehicle = require('../models/Vehicle');
const Driver = require('../models/Driver');
const Trip = require('../models/Trip');
const Branch = require('../models/Branch');
const MaintenanceJob = require('../models/MaintenanceJob');
const Expense = require('../models/Expense');
const Incident = require('../models/Incident');
const User = require('../models/User');

// @desc Unified Global Search across all fleet entities
// @route GET /api/search?q=...
const globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ results: [] });
    }

    const branchFilter = { ...req.branchFilter };
    const queryRegex = { $regex: q.trim(), $options: 'i' };

    const [vehicles, trips, branches, drivers, maintJobs, expenses, incidents] = await Promise.all([
      // Vehicles
      Vehicle.find({
        ...branchFilter,
        $or: [{ plateNumber: queryRegex }, { vin: queryRegex }, { make: queryRegex }, { model: queryRegex }]
      })
        .limit(4)
        .populate('branch', 'name code'),

      // Trips
      Trip.find({
        ...branchFilter,
        $or: [{ tripNumber: queryRegex }, { origin: queryRegex }, { destination: queryRegex }, { cargoDetails: queryRegex }]
      })
        .limit(4)
        .populate('vehicle', 'plateNumber'),

      // Branches
      Branch.find({
        $or: [{ name: queryRegex }, { code: queryRegex }, { city: queryRegex }]
      }).limit(3),

      // Drivers
      Driver.find({
        ...branchFilter,
        $or: [{ licenseNumber: queryRegex }]
      })
        .limit(4)
        .populate('user', 'name email'),

      // Maintenance
      MaintenanceJob.find({
        ...branchFilter,
        $or: [{ jobNumber: queryRegex }, { workDescription: queryRegex }, { type: queryRegex }]
      })
        .limit(3)
        .populate('vehicle', 'plateNumber'),

      // Expenses
      Expense.find({
        ...branchFilter,
        $or: [{ title: queryRegex }, { category: queryRegex }]
      }).limit(3),

      // Incidents
      Incident.find({
        ...branchFilter,
        $or: [{ incidentNumber: queryRegex }, { location: queryRegex }, { description: queryRegex }]
      }).limit(3)
    ]);

    const results = [
      ...vehicles.map(v => ({
        type: 'Vehicle',
        id: v._id,
        title: `${v.plateNumber} — ${v.make} ${v.model}`,
        subtitle: `${v.type} &bull; ${v.branch?.name || 'Hub'} &bull; ${v.currentOdometer.toLocaleString()} km`,
        badge: v.status,
        targetTab: 'vehicles'
      })),
      ...trips.map(t => ({
        type: 'Trip',
        id: t._id,
        title: `${t.tripNumber}: ${t.origin} → ${t.destination}`,
        subtitle: `Vehicle: ${t.vehicle?.plateNumber || 'Assigned'} &bull; ${t.estimatedDistanceKm} km`,
        badge: t.status,
        targetTab: 'trips'
      })),
      ...drivers.map(d => ({
        type: 'Driver',
        id: d._id,
        title: `${d.user?.name || 'Driver'} (${d.licenseNumber})`,
        subtitle: `Class ${d.licenseClass} &bull; Rating: ${d.safetyRating}★`,
        badge: d.status,
        targetTab: 'drivers'
      })),
      ...branches.map(b => ({
        type: 'Branch',
        id: b._id,
        title: `${b.name} (${b.code})`,
        subtitle: `${b.city} &bull; ${b.address}`,
        badge: 'Hub',
        targetTab: 'dashboard'
      })),
      ...maintJobs.map(m => ({
        type: 'Maintenance',
        id: m._id,
        title: `${m.jobNumber} — ${m.type}`,
        subtitle: `${m.vehicle?.plateNumber || 'Fleet Unit'}: ${m.workDescription}`,
        badge: m.status,
        targetTab: 'maintenance'
      })),
      ...expenses.map(e => ({
        type: 'Expense',
        id: e._id,
        title: `${e.title} ($${e.amount})`,
        subtitle: `Category: ${e.category} &bull; ${new Date(e.date).toLocaleDateString()}`,
        badge: e.status,
        targetTab: 'expenses'
      })),
      ...incidents.map(i => ({
        type: 'Incident',
        id: i._id,
        title: `${i.incidentNumber}: ${i.severity}`,
        subtitle: `Location: ${i.location} &bull; ${i.description.substring(0, 40)}...`,
        badge: i.status,
        targetTab: 'incidents'
      }))
    ];

    res.json({ results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { globalSearch };
