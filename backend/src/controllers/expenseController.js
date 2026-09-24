const Expense = require('../models/Expense');
const Driver = require('../models/Driver');
const logAuditAction = require('../utils/auditLogger');

// @desc Get expenses list
// @route GET /api/expenses
const getExpenses = async (req, res) => {
  try {
    const { category, status, vehicleId, driverId, startDate, endDate } = req.query;
    let query = { ...req.branchFilter };

    if (category) query.category = category;
    if (status) query.status = status;
    if (vehicleId) query.vehicle = vehicleId;
    if (driverId) query.driver = driverId;

    if (req.user.role === 'Driver') {
      const driverRecord = await Driver.findOne({ user: req.user._id });
      if (driverRecord) {
        query.driver = driverRecord._id;
      }
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(query)
      .populate('vehicle', 'plateNumber make model')
      .populate('trip', 'tripNumber origin destination')
      .populate({
        path: 'driver',
        populate: { path: 'user', select: 'name email phone' }
      })
      .populate('branch', 'name code')
      .populate('approvedBy', 'name role')
      .sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get expense by ID
// @route GET /api/expenses/:id
const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate('vehicle')
      .populate('trip')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name email' } })
      .populate('branch')
      .populate('approvedBy', 'name role');

    if (!expense) return res.status(404).json({ message: 'Expense record not found' });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create new expense
// @route POST /api/expenses
const createExpense = async (req, res) => {
  try {
    const {
      title,
      category,
      amount,
      date,
      branch,
      vehicle,
      trip,
      driver,
      receiptUrl,
      notes
    } = req.body;

    if (!title || !category || amount === undefined) {
      return res.status(400).json({ message: 'Title, category, and amount are required' });
    }

    let finalBranch = branch;
    let finalDriver = driver;

    if (req.user.role === 'Driver') {
      const driverRecord = await Driver.findOne({ user: req.user._id });
      if (driverRecord) {
        finalDriver = driverRecord._id;
        finalBranch = driverRecord.branch;
      }
    }

    if (!finalBranch && req.user.branch) {
      finalBranch = req.user.branch._id || req.user.branch;
    }

    const expense = new Expense({
      title,
      category,
      amount: Number(amount),
      date: date || new Date(),
      branch: finalBranch,
      vehicle: vehicle || null,
      trip: trip || null,
      driver: finalDriver || null,
      receiptUrl: receiptUrl || null,
      notes: notes || '',
      status: 'Pending'
    });

    await expense.save();

    await logAuditAction({
      action: 'EXPENSE_CREATED',
      user: req.user,
      branch: finalBranch,
      details: `Created expense "${title}" of amount $${amount} under ${category}`
    });

    res.status(201).json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update expense status (Approve / Reject)
// @route PATCH /api/expenses/:id/status
const updateExpenseStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Approved, Rejected, or Pending.' });
    }

    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    expense.status = status;
    if (status === 'Approved') {
      expense.approvedBy = req.user._id;
      expense.rejectionReason = undefined;
    } else if (status === 'Rejected') {
      expense.approvedBy = req.user._id;
      expense.rejectionReason = rejectionReason || 'Rejected by finance authority';
    } else {
      expense.approvedBy = undefined;
      expense.rejectionReason = undefined;
    }

    await expense.save();

    await logAuditAction({
      action: `EXPENSE_${status.toUpperCase()}`,
      user: req.user,
      branch: expense.branch,
      details: `Expense "${expense.title}" status changed to ${status}${rejectionReason ? ` (Reason: ${rejectionReason})` : ''}`
    });

    res.json(expense);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete expense
// @route DELETE /api/expenses/:id
const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ message: 'Expense not found' });

    await expense.deleteOne();

    await logAuditAction({
      action: 'EXPENSE_DELETED',
      user: req.user,
      branch: expense.branch,
      details: `Deleted expense "${expense.title}" ($${expense.amount})`
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get expense summary & analytics
// @route GET /api/expenses/summary
const getExpenseSummary = async (req, res) => {
  try {
    const match = { ...req.branchFilter };

    const categoryBreakdown = await Expense.aggregate([
      { $match: match },
      { $group: { _id: '$category', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { totalAmount: -1 } }
    ]);

    const statusBreakdown = await Expense.aggregate([
      { $match: match },
      { $group: { _id: '$status', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    const totalSpendResult = await Expense.aggregate([
      { $match: { ...match, status: { $in: ['Approved', 'Pending'] } } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    res.json({
      totalSpend: totalSpendResult[0]?.total || 0,
      byCategory: categoryBreakdown,
      byStatus: statusBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpenseStatus,
  deleteExpense,
  getExpenseSummary
};