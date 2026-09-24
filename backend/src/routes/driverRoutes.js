const express = require('express');
const router = express.Router();
const { getDrivers, createDriver, updateDriver } = require('../controllers/driverController');
const { protect, authorize, branchScope } = require('../middleware/authMiddleware');

router.get('/', protect, branchScope, getDrivers);
router.post('/', protect, authorize('Super Admin', 'Fleet Manager', 'Branch Manager'), createDriver);
router.put('/:id', protect, authorize('Super Admin', 'Fleet Manager', 'Branch Manager'), updateDriver);

module.exports = router;
