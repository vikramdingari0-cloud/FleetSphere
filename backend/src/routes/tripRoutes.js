const express = require('express');
const router = express.Router();
const {
  getTrips,
  getTripById,
  createTrip,
  updateTripStatus
} = require('../controllers/tripController');
const { protect, authorize, branchScope } = require('../middleware/authMiddleware');

router.get('/', protect, branchScope, getTrips);
router.get('/:id', protect, getTripById);
router.post('/', protect, authorize('Super Admin', 'Fleet Manager', 'Branch Manager'), createTrip);
router.patch('/:id/status', protect, updateTripStatus);

module.exports = router;
