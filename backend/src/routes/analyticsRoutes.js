const express = require('express');
const router = express.Router();
const { getDashboardAnalytics } = require('../controllers/analyticsController');
const { protect, branchScope } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, branchScope, getDashboardAnalytics);

module.exports = router;
