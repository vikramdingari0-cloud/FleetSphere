const Document = require('../models/Document');
const logAuditAction = require('../utils/auditLogger');

// @desc Get documents list with compliance status
// @route GET /api/documents
const getDocuments = async (req, res) => {
  try {
    const { entityType, status, documentType } = req.query;
    let query = { ...req.branchFilter };

    if (entityType) query.entityType = entityType;
    if (status) query.status = status;
    if (documentType) query.documentType = documentType;

    const documents = await Document.find(query)
      .populate('vehicle', 'plateNumber make model')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name email' } })
      .populate('branch', 'name code')
      .sort({ expiryDate: 1 });

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

    const doc = new Document({
      title,
      documentType,
      entityType,
      vehicle: vehicle || null,
      driver: driver || null,
      branch: branch || req.user.branch || null,
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

    await doc.deleteOne();

    await logAuditAction({
      action: 'DOCUMENT_DELETED',
      user: req.user,
      branch: doc.branch,
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
      details: `Updated/Renewed document "${doc.title}" (Status: ${doc.status})`
    });

    const populated = await Document.findById(doc._id)
      .populate('vehicle', 'plateNumber make model')
      .populate({ path: 'driver', populate: { path: 'user', select: 'name email' } })
      .populate('branch', 'name code');

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
