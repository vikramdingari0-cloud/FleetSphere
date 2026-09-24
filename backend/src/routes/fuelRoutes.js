const express = require('express');
const router = express.Router();
const { getFuelEntries, createFuelEntry } = require('../controllers/fuelController');
const { protect, branchScope } = require('../middleware/authMiddleware');

router.get('/', protect, branchScope, getFuelEntries);
router.post('/', protect, createFuelEntry);

module.exports = router;
