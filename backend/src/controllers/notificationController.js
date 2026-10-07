const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const MaintenanceJob = require('../models/MaintenanceJob');
const Expense = require('../models/Expense');
const Document = require('../models/Document');
const Incident = require('../models/Incident');

// @desc Get real-time dynamic notifications derived from actual fleet records
// @route GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const branchFilter = { ...req.branchFilter };
    const notifications = [];

    // 1. CRITICAL CATEGORY: Severe & Critical Incidents
    const criticalIncidents = await Incident.find({
      ...branchFilter,
      severity: { $in: ['Critical', 'Severe'] },
      status: { $in: ['Reported', 'Under Investigation', 'Action Required'] }
    })
      .populate('vehicle', 'plateNumber')
      .sort({ dateTime: -1 })
      .limit(5);

    criticalIncidents.forEach(inc => {
      notifications.push({
        id: `notif-inc-${inc._id}`,
        category: 'Critical',
        title: `Critical Incident: ${inc.incidentNumber}`,
        message: `${inc.severity} incident reported at ${inc.location}: ${inc.description.substring(0, 60)}...`,
        timestamp: inc.dateTime,
        severity: 'critical',
        targetTab: 'incidents',
        recordId: inc._id
      });
    });

    // 2. OPERATIONAL CATEGORY: Delayed Trips
    const delayedTrips = await Trip.find({
      ...branchFilter,
      status: 'Delayed'
    })
      .populate('vehicle', 'plateNumber')
      .limit(5);

    delayedTrips.forEach(t => {
      notifications.push({
        id: `notif-trip-${t._id}`,
        category: 'Operational',
        title: `Dispatch Delayed: ${t.tripNumber}`,
        message: `Trip from ${t.origin} to ${t.destination} delayed. Reason: ${t.delayReason || 'En route congestion / check in required'}`,
        timestamp: t.updatedAt || t.createdAt,
        severity: 'warning',
        targetTab: 'trips',
        recordId: t._id
      });
    });

    // 3. MAINTENANCE CATEGORY: Overdue vehicles & High Priority Work Orders
    const overdueVehicles = await Vehicle.find({
      ...branchFilter,
      isOverdueForService: true
    })
      .limit(5);

    overdueVehicles.forEach(v => {
      notifications.push({
        id: `notif-maint-veh-${v._id}`,
        category: 'Maintenance',
        title: `Service Overdue: ${v.plateNumber}`,
        message: `${v.make} ${v.model} is overdue for preventive maintenance (${v.currentOdometer.toLocaleString()} km).`,
        timestamp: v.updatedAt || new Date(),
        severity: 'warning',
        targetTab: 'maintenance',
        recordId: v._id
      });
    });

    const activeMaint = await MaintenanceJob.find({
      ...branchFilter,
      priority: { $in: ['Critical', 'High'] },
      status: { $in: ['Scheduled', 'In Progress'] }
    })
      .populate('vehicle', 'plateNumber')
      .limit(5);

    activeMaint.forEach(m => {
      notifications.push({
        id: `notif-maint-job-${m._id}`,
        category: 'Maintenance',
        title: `High-Priority Service: ${m.jobNumber}`,
        message: `${m.type} for ${m.vehicle?.plateNumber} (${m.workDescription}) is ${m.status.toLowerCase()}.`,
        timestamp: m.scheduledDate,
        severity: 'critical',
        targetTab: 'maintenance',
        recordId: m._id
      });
    });

    // 4. FINANCE CATEGORY: Pending Expense Claims
    const pendingExpenses = await Expense.find({
      ...branchFilter,
      status: 'Pending'
    })
      .sort({ date: -1 })
      .limit(5);

    pendingExpenses.forEach(exp => {
      notifications.push({
        id: `notif-exp-${exp._id}`,
        category: 'Finance',
        title: `Pending Expense Approval: $${exp.amount.toLocaleString()}`,
        message: `Claim "${exp.title}" (${exp.category}) requires authorization.`,
        timestamp: exp.date,
        severity: 'info',
        targetTab: 'expenses',
        recordId: exp._id
      });
    });

    // 5. DOCUMENTS CATEGORY: Expiring & Expired Compliance Vault Records
    const expiringDocs = await Document.find({
      ...branchFilter,
      status: { $in: ['Expired', 'Expiring Soon'] }
    })
      .sort({ expiryDate: 1 })
      .limit(5);

    expiringDocs.forEach(doc => {
      notifications.push({
        id: `notif-doc-${doc._id}`,
        category: 'Documents',
        title: `${doc.status === 'Expired' ? 'Expired' : 'Expiring'} Compliance: ${doc.title}`,
        message: `${doc.documentType} status is ${doc.status.toLowerCase()} (Expiry: ${doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : 'N/A'}).`,
        timestamp: doc.expiryDate || doc.createdAt,
        severity: doc.status === 'Expired' ? 'critical' : 'warning',
        targetTab: 'documents',
        recordId: doc._id
      });
    });

    // Sort by timestamp descending
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      total: notifications.length,
      unreadCount: notifications.filter(n => n.severity === 'critical' || n.severity === 'warning').length,
      notifications
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getNotifications };
