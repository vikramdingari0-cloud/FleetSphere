const express = require('express');
const router = express.Router();
const { globalSearch } = require('../controllers/searchController');
const { protect, branchScope } = require('../middleware/authMiddleware');

router.get('/', protect, branchScope, globalSearch);

module.exports = router;
