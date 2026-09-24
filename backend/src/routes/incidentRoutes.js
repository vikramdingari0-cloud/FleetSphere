const express = require('express');
const router = express.Router();
const { getIncidents, createIncident, updateIncident } = require('../controllers/incidentController');
const { protect, authorize, branchScope } = require('../middleware/authMiddleware');

router.get('/', protect, branchScope, getIncidents);
router.post('/', protect, createIncident);
router.put('/:id', protect, authorize('Super Admin', 'Fleet Manager', 'Branch Manager'), updateIncident);

module.exports = router;
