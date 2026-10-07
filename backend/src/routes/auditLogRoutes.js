const express = require('express');
const router = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect, authorize, branchScope } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('Super Admin', 'Fleet Manager', 'Finance Officer'), branchScope, getAuditLogs);

module.exports = router;
