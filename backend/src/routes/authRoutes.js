const express = require('express');
const router = express.Router();
const { loginUser, getMe, createUser, getUsers } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('Super Admin', 'Fleet Manager', 'Branch Manager'), getUsers);
router.post('/users', protect, authorize('Super Admin', 'Fleet Manager'), createUser);

module.exports = router;
