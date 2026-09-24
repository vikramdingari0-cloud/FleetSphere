const express = require('express');
const router = express.Router();
const {
  getMaintenanceJobs,
  createMaintenanceJob,
  updateMaintenanceJob
} = require('../controllers/maintenanceController');
const { protect, authorize, branchScope } = require('../middleware/authMiddleware');

router.get('/', protect, branchScope, getMaintenanceJobs);
router.post('/', protect, authorize('Super Admin', 'Fleet Manager', 'Branch Manager'), createMaintenanceJob);
router.put('/:id', protect, authorize('Super Admin', 'Fleet Manager', 'Branch Manager'), updateMaintenanceJob);

module.exports = router;
