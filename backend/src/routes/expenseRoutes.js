const express = require('express');
const router = express.Router();
const {
  getExpenses,
  getExpenseById,
  createExpense,
  updateExpenseStatus,
  deleteExpense,
  getExpenseSummary
} = require('../controllers/expenseController');
const { protect, authorize, branchScope } = require('../middleware/authMiddleware');

router.get('/summary', protect, branchScope, getExpenseSummary);
router.get('/', protect, branchScope, getExpenses);
router.get('/:id', protect, getExpenseById);
router.post('/', protect, createExpense);
router.patch(
  '/:id/status',
  protect,
  authorize('Super Admin', 'Fleet Manager', 'Finance Officer', 'Branch Manager'),
  updateExpenseStatus
);
router.delete(
  '/:id',
  protect,
  authorize('Super Admin', 'Finance Officer'),
  deleteExpense
);

module.exports = router;
