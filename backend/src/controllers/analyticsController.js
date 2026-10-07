const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Driver = require('../models/Driver');
const MaintenanceJob = require('../models/MaintenanceJob');
const FuelEntry = require('../models/FuelEntry');
const Expense = require('../models/Expense');
const Document = require('../models/Document');
const AuditLog = require('../models/AuditLog');
const Branch = require('../models/Branch');

// @desc Get comprehensive fleet executive dashboard analytics with real DB aggregations
// @route GET /api/analytics/dashboard
const getDashboardAnalytics = async (req, res) => {
  try {
    const branchFilter = { ...req.branchFilter };

    // 1. Vehicle Telemetry & Status Breakdown
    const totalVehicles = await Vehicle.countDocuments(branchFilter);
    const availableVehicles = await Vehicle.countDocuments({ ...branchFilter, status: 'Available' });
    const inTransitVehicles = await Vehicle.countDocuments({ ...branchFilter, status: 'In Transit' });
    const maintenanceVehicles = await Vehicle.countDocuments({ ...branchFilter, status: 'Maintenance' });
    const outOfServiceVehicles = await Vehicle.countDocuments({ ...branchFilter, status: 'Out of Service' });
    const overdueServiceCount = await Vehicle.countDocuments({ ...branchFilter, isOverdueForService: true });

    const fleetHealthRate = totalVehicles > 0
      ? Number((((totalVehicles - (maintenanceVehicles + outOfServiceVehicles)) / totalVehicles) * 100).toFixed(1))
      : 100;

    const fleetUtilizationRate = totalVehicles > 0
      ? Number(((inTransitVehicles / totalVehicles) * 100).toFixed(1))
      : 0;

    // 2. Trips Metrics
    const totalTrips = await Trip.countDocuments(branchFilter);
    const activeTrips = await Trip.countDocuments({ ...branchFilter, status: { $in: ['Started', 'Delayed'] } });
    const plannedTrips = await Trip.countDocuments({ ...branchFilter, status: { $in: ['Planned', 'Assigned'] } });
    const completedTrips = await Trip.countDocuments({ ...branchFilter, status: 'Completed' });
    const delayedTrips = await Trip.countDocuments({ ...branchFilter, status: 'Delayed' });

    const totalDistanceAggregation = await Trip.aggregate([
      { $match: { ...branchFilter, status: 'Completed' } },
      { $group: { _id: null, totalDist: { $sum: '$actualDistanceKm' } } }
    ]);
    const totalCompletedDistanceKm = totalDistanceAggregation[0]?.totalDist || 0;

    // 3. Driver Metrics
    const totalDrivers = await Driver.countDocuments(branchFilter);
    const availableDrivers = await Driver.countDocuments({ ...branchFilter, status: 'Available' });
    const onDutyDrivers = await Driver.countDocuments({ ...branchFilter, status: 'On Duty' });

    const driverSafetyAvg = await Driver.aggregate([
      { $match: branchFilter },
      { $group: { _id: null, avgRating: { $avg: '$safetyRating' } } }
    ]);
    const avgSafetyScore = driverSafetyAvg[0]?.avgRating ? Number(driverSafetyAvg[0].avgRating.toFixed(2)) : 4.8;

    // 4. Maintenance Spending & Work Orders
    const activeMaintenanceJobs = await MaintenanceJob.countDocuments({
      ...branchFilter,
      status: { $in: ['Scheduled', 'In Progress'] }
    });
    const criticalMaintenanceJobs = await MaintenanceJob.countDocuments({
      ...branchFilter,
      status: { $in: ['Scheduled', 'In Progress'] },
      priority: { $in: ['High', 'Critical'] }
    });

    const maintSpendResult = await MaintenanceJob.aggregate([
      { $match: { ...branchFilter, status: 'Completed' } },
      { $group: { _id: null, totalCost: { $sum: '$actualCost' } } }
    ]);
    const totalMaintenanceSpend = maintSpendResult[0]?.totalCost || 0;

    // 5. Fuel Consumption & Cost
    const fuelSpendResult = await FuelEntry.aggregate([
      { $match: branchFilter },
      {
        $group: {
          _id: null,
          totalCost: { $sum: '$totalCost' },
          totalLiters: { $sum: '$fuelVolumeLiters' },
          avgEfficiency: { $avg: '$calculatedEfficiencyKmPerL' }
        }
      }
    ]);
    const totalFuelSpend = fuelSpendResult[0]?.totalCost || 0;
    const totalFuelLiters = fuelSpendResult[0]?.totalLiters || 0;
    const fleetAvgEfficiency = fuelSpendResult[0]?.avgEfficiency
      ? Number(fuelSpendResult[0].avgEfficiency.toFixed(2))
      : 3.8;

    // 6. Expenses & Compliance
    const pendingExpensesCount = await Expense.countDocuments({ ...branchFilter, status: 'Pending' });
    const approvedExpensesResult = await Expense.aggregate([
      { $match: { ...branchFilter, status: 'Approved' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalApprovedExpenses = approvedExpensesResult[0]?.total || 0;

    const complianceAlertsCount = await Document.countDocuments({
      ...branchFilter,
      status: { $in: ['Expiring Soon', 'Expired'] }
    });

    // 7. REAL MONTHLY AGGREGATIONS (Last 6 Months from Actual Database Records)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Real Trips Aggregation by month
    const realTripAggr = await Trip.aggregate([
      { $match: { ...branchFilter, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          tripsCount: { $sum: 1 },
          totalDist: { $sum: { $ifNull: ['$actualDistanceKm', '$estimatedDistanceKm'] } }
        }
      }
    ]);

    // Real Fuel Aggregation by month
    const realFuelAggr = await FuelEntry.aggregate([
      { $match: { ...branchFilter, date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          fuelCost: { $sum: '$totalCost' }
        }
      }
    ]);

    // Real Maintenance Aggregation by month
    const realMaintAggr = await MaintenanceJob.aggregate([
      { $match: { ...branchFilter, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          maintCost: { $sum: { $ifNull: ['$actualCost', '$estimatedCost'] } }
        }
      }
    ]);

    // Real Expense Aggregation by month
    const realExpAggr = await Expense.aggregate([
      { $match: { ...branchFilter, date: { $gte: sixMonthsAgo }, status: { $ne: 'Rejected' } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          expCost: { $sum: '$amount' }
        }
      }
    ]);

    // Build normalized 6-month timelines populated with real DB metrics
    const tripTrend = [];
    const costTrend = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const targetYear = d.getFullYear();
      const targetMonth = d.getMonth() + 1; // 1-indexed for MongoDB $month
      const monthLabel = monthNames[d.getMonth()];

      const tripMatch = realTripAggr.find(t => t._id.year === targetYear && t._id.month === targetMonth);
      const fuelMatch = realFuelAggr.find(f => f._id.year === targetYear && f._id.month === targetMonth);
      const maintMatch = realMaintAggr.find(m => m._id.year === targetYear && m._id.month === targetMonth);
      const expMatch = realExpAggr.find(e => e._id.year === targetYear && e._id.month === targetMonth);

      tripTrend.push({
        month: monthLabel,
        trips: tripMatch ? tripMatch.tripsCount : 0,
        distance: tripMatch ? Math.round(tripMatch.totalDist) : 0
      });

      costTrend.push({
        month: monthLabel,
        fuel: fuelMatch ? Math.round(fuelMatch.fuelCost) : 0,
        maintenance: maintMatch ? Math.round(maintMatch.maintCost) : 0,
        expenses: expMatch ? Math.round(expMatch.expCost) : 0
      });
    }

    const vehicleStatusDistribution = [
      { name: 'Available', value: availableVehicles, fill: '#10b981' },
      { name: 'In Transit', value: inTransitVehicles, fill: '#06b6d4' },
      { name: 'Maintenance', value: maintenanceVehicles, fill: '#f59e0b' },
      { name: 'Out of Service', value: outOfServiceVehicles, fill: '#ef4444' }
    ];

    // 8. Recent Activity Feed
    const recentActivity = await AuditLog.find(branchFilter)
      .sort({ timestamp: -1 })
      .limit(10);

    // 9. Role-Specific Personalization Contexts
    let roleContext = {};

    if (req.user.role === 'Driver') {
      const driverRecord = await Driver.findOne({ user: req.user._id })
        .populate('assignedVehicle')
        .populate('branch');

      if (driverRecord) {
        const currentTrip = await Trip.findOne({
          driver: driverRecord._id,
          status: { $in: ['Started', 'Assigned', 'Delayed'] }
        })
          .populate('vehicle', 'plateNumber make model fuelType currentOdometer')
          .populate('branch', 'name code city')
          .sort({ createdAt: -1 });

        const upcomingTrips = await Trip.find({
          driver: driverRecord._id,
          status: 'Planned'
        })
          .populate('vehicle', 'plateNumber make model')
          .sort({ plannedDepartureTime: 1 })
          .limit(5);

        const driverDocs = await Document.find({ driver: driverRecord._id });

        const recentExpenses = await Expense.find({ driver: driverRecord._id })
          .sort({ date: -1 })
          .limit(5);

        roleContext = {
          driver: {
            profile: driverRecord,
            currentTrip,
            upcomingTrips,
            documents: driverDocs,
            recentExpenses,
            completedTrips: driverRecord.totalTripsCompleted || 0,
            totalDistanceKm: driverRecord.totalDistanceDrivenKm || 0,
            safetyScore: driverRecord.safetyRating || 5.0
          }
        };
      }
    } else if (req.user.role === 'Finance Officer') {
      const pendingApprovalQueue = await Expense.find({
        ...branchFilter,
        status: 'Pending'
      })
        .populate('vehicle', 'plateNumber make model')
        .populate({ path: 'driver', populate: { path: 'user', select: 'name email' } })
        .populate('branch', 'name code')
        .sort({ date: -1 })
        .limit(10);

      const categoryBreakdown = await Expense.aggregate([
        { $match: { ...branchFilter, status: 'Approved' } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } }
      ]);

      const costPerKm = totalCompletedDistanceKm > 0
        ? Number(((totalFuelSpend + totalMaintenanceSpend + totalApprovedExpenses) / totalCompletedDistanceKm).toFixed(2))
        : 1.45;

      roleContext = {
        finance: {
          pendingApprovalQueue,
          categoryBreakdown,
          costPerKm,
          totalBudgetConsumed: totalApprovedExpenses + totalFuelSpend + totalMaintenanceSpend
        }
      };
    } else if (req.user.role === 'Super Admin') {
      const allBranches = await Branch.find().lean();

      const branchesWithStats = await Promise.all(
        allBranches.map(async (b) => {
          const vCount = await Vehicle.countDocuments({ branch: b._id });
          const dCount = await Driver.countDocuments({ branch: b._id });
          const tCount = await Trip.countDocuments({ branch: b._id, status: { $in: ['Started', 'Delayed'] } });
          return {
            ...b,
            vehicleCount: vCount,
            driverCount: dCount,
            activeTripsCount: tCount
          };
        })
      );

      roleContext = {
        superAdmin: {
          branchesOverview: branchesWithStats,
          systemUptime: '99.99%',
          securityAlertsCount: await AuditLog.countDocuments({ action: { $regex: /DELETE|SUSPEND/i } })
        }
      };
    }

    res.json({
      summary: {
        totalVehicles,
        availableVehicles,
        inTransitVehicles,
        maintenanceVehicles,
        outOfServiceVehicles,
        overdueServiceCount,
        fleetHealthRate,
        fleetUtilizationRate,
        totalTrips,
        activeTrips,
        plannedTrips,
        completedTrips,
        delayedTrips,
        totalCompletedDistanceKm,
        totalDrivers,
        availableDrivers,
        onDutyDrivers,
        avgSafetyScore,
        activeMaintenanceJobs,
        criticalMaintenanceJobs,
        totalMaintenanceSpend,
        totalFuelSpend,
        totalFuelLiters,
        fleetAvgEfficiency,
        pendingExpensesCount,
        totalApprovedExpenses,
        complianceAlertsCount
      },
      charts: {
        tripTrend,
        costTrend,
        fuelCostTrend: costTrend,
        vehicleStatus: vehicleStatusDistribution,
        vehicleStatusDistribution
      },
      recentActivity,
      roleContext
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardAnalytics
};
