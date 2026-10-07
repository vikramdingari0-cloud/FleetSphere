const AuditLog = require('../models/AuditLog');

// @desc Get audit logs with filtering, action search, branch scoping, and pagination
// @route GET /api/audit-logs
const getAuditLogs = async (req, res) => {
  try {
    const { action, search, startDate, endDate, page, limit } = req.query;
    let query = { ...req.branchFilter };

    if (action && action !== 'ALL') query.action = action;

    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { details: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userRole: { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const total = await AuditLog.countDocuments(query);
    res.set('X-Total-Count', total);

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;

    const logs = await AuditLog.find(query)
      .populate('user', 'name email avatar role')
      .populate('branch', 'name code city')
      .sort({ timestamp: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    if (req.query.paginated === 'true') {
      return res.json({
        data: logs,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAuditLogs };
