const express = require('express');
const router = express.Router();
const { getDocuments, createDocument, updateDocument, deleteDocument } = require('../controllers/documentController');
const { protect, authorize, branchScope } = require('../middleware/authMiddleware');

router.get('/', protect, branchScope, getDocuments);
router.post('/', protect, authorize('Super Admin', 'Fleet Manager', 'Branch Manager'), createDocument);
router.put('/:id', protect, authorize('Super Admin', 'Fleet Manager', 'Branch Manager'), updateDocument);
router.delete('/:id', protect, authorize('Super Admin', 'Fleet Manager'), deleteDocument);

module.exports = router;
