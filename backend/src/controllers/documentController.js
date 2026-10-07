const Document = require('../models/Document');
const logAuditAction = require('../utils/auditLogger');
const { canAccessBranch, canAccessTenant } = require('../middleware/authMiddleware');

// @desc Get documents list with compliance status & pagination
// @route GET /api/documents
const getDocuments = async (req, res) => {
  try {
    const { entityType, status, documentType, page, limit } = req.query;
    let query = { ...req.branchFilter };

    if (entityType && entityType !== 'ALL') query.entityType = entityType;
    if (status && status !== 'ALL') query.status = status;
    if (documentType && documentType !== 'ALL') query.documentType = documentType;

    const total = await Document.countDocuments(query);
    res.set('X-Total-Count', total);

    let queryBuilder = Document.find(query)
      .populate('vehicle', 'plateNumber make model')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name email' } })
      .populate('branch', 'name code city')
      .sort({ expiryDate: 1 });

    if (page && limit) {
      const pageNum = parseInt(page, 10) || 1;
      const limitNum = parseInt(limit, 10) || 10;
      queryBuilder = queryBuilder.skip((pageNum - 1) * limitNum).limit(limitNum);
    }

    const documents = await queryBuilder;

    if (req.query.paginated === 'true') {
      const limitNum = parseInt(limit, 10) || 10;
      return res.json({
        data: documents,
        pagination: {
          total,
          page: parseInt(page, 10) || 1,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1
        }
      });
    }

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create document record
// @route POST /api/documents
const createDocument = async (req, res) => {
  try {
    const {
      title,
      documentType,
      entityType,
      vehicle,
      driver,
      branch,
      fileUrl,
      issueDate,
      expiryDate,
      notes
    } = req.body;

    if (!title || !documentType || !entityType) {
      return res.status(400).json({ message: 'Title, documentType, and entityType are required' });
    }

    const targetBranch = branch || (req.user.branch ? (req.user.branch._id || req.user.branch) : null);
    const organization = req.user.organization ? (req.user.organization._id || req.user.organization) : null;

    const doc = new Document({
      title,
      documentType,
      entityType,
      vehicle: vehicle || null,
      driver: driver || null,
      branch: targetBranch,
      organization,
      fileUrl: fileUrl || 'https://fleetsphere.storage/docs/sample_doc.pdf',
      issueDate: issueDate || new Date(),
      expiryDate: expiryDate || null,
      notes: notes || ''
    });

    await doc.save();

    await logAuditAction({
      action: 'DOCUMENT_UPLOADED',
      user: req.user,
      branch: doc.branch,
      organization,
      details: `Registered document "${title}" (${documentType})`
    });

    res.status(201).json(doc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Delete document
// @route DELETE /api/documents/:id
const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (!canAccessTenant(req.user, doc.organization)) {
      return res.status(403).json({ message: 'Access denied: Cross-organization document deletion forbidden' });
    }
    if (!canAccessBranch(req.user, doc.branch)) {
      return res.status(403).json({ message: 'Access denied: Document belongs to another branch' });
    }

    await doc.deleteOne();

    await logAuditAction({
      action: 'DOCUMENT_DELETED',
      user: req.user,
      branch: doc.branch,
      organization: doc.organization,
      details: `Deleted document "${doc.title}"`
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update document (Renew, update expiry, title, notes)
// @route PUT /api/documents/:id
const updateDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (!canAccessTenant(req.user, doc.organization)) {
      return res.status(403).json({ message: 'Access denied: Cross-organization document update forbidden' });
    }
    if (!canAccessBranch(req.user, doc.branch)) {
      return res.status(403).json({ message: 'Access denied: Document belongs to another branch' });
    }

    const { title, expiryDate, issueDate, notes, status, fileUrl } = req.body;
    if (title) doc.title = title;
    if (expiryDate !== undefined) doc.expiryDate = expiryDate;
    if (issueDate !== undefined) doc.issueDate = issueDate;
    if (notes !== undefined) doc.notes = notes;
    if (fileUrl) doc.fileUrl = fileUrl;
    if (status) doc.status = status;

    await doc.save();

    await logAuditAction({
      action: 'DOCUMENT_UPDATED',
      user: req.user,
      branch: doc.branch,
      organization: doc.organization,
      details: `Updated/Renewed document "${doc.title}" (Status: ${doc.status})`
    });

    const populated = await Document.findById(doc._id)
      .populate('vehicle', 'plateNumber make model')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name email' } })
      .populate('branch', 'name code city');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument
};
