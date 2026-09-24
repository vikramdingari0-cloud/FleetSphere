const express = require('express');
const router = express.Router();
const { getBranches, createBranch, updateBranch } = require('../controllers/branchController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, getBranches);
router.post('/', protect, authorize('Super Admin'), createBranch);
router.put('/:id', protect, authorize('Super Admin'), updateBranch);

module.exports = router;
