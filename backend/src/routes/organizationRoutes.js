const express = require('express');
const router = express.Router();
const {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization
} = require('../controllers/organizationController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, authorize('Super Admin', 'Fleet Manager', 'Finance Officer'), getOrganizations);
router.get('/:id', protect, authorize('Super Admin', 'Fleet Manager', 'Finance Officer'), getOrganizationById);
router.post('/', protect, authorize('Super Admin'), createOrganization);
router.put('/:id', protect, authorize('Super Admin'), updateOrganization);

module.exports = router;
