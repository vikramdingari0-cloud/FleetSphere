const express = require('express');
const router = express.Router();
const { getNotifications } = require('../controllers/notificationController');
const { protect, branchScope } = require('../middleware/authMiddleware');

router.get('/', protect, branchScope, getNotifications);

module.exports = router;
