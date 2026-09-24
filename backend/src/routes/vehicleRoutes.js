const express = require('express');
const router = express.Router();
const {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  updateVehicleStatus
} = require('../controllers/vehicleController');
const { protect, authorize, branchScope } = require('../middleware/authMiddleware');

router.get('/', protect, branchScope, getVehicles);
router.get('/:id', protect, getVehicleById);
router.post('/', protect, authorize('Super Admin', 'Fleet Manager', 'Branch Manager'), createVehicle);
router.put('/:id', protect, authorize('Super Admin', 'Fleet Manager', 'Branch Manager'), updateVehicle);
router.patch('/:id/status', protect, authorize('Super Admin', 'Fleet Manager', 'Branch Manager'), updateVehicleStatus);

module.exports = router;
