const Branch = require('../models/Branch');
const logAuditAction = require('../utils/auditLogger');
const { canAccessTenant } = require('../middleware/authMiddleware');

const getBranches = async (req, res) => {
  try {
    let query = { isActive: true };
    if (req.user && req.user.organization) {
      query.organization = req.user.organization._id || req.user.organization;
    }
    const branches = await Branch.find(query).sort({ name: 1 });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBranch = async (req, res) => {
  try {
    const { name, code, city, address, contactPhone, contactEmail, capacity } = req.body;

    if (!name || !code || !city || !address) {
      return res.status(400).json({ message: 'Name, branch code, city, and address are required' });
    }

    const existing = await Branch.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: `Branch code '${code}' already exists` });
    }

    const organization = req.user.organization ? (req.user.organization._id || req.user.organization) : null;

    const branch = await Branch.create({
      name,
      code: code.toUpperCase(),
      city,
      address,
      contactPhone,
      contactEmail,
      capacity: capacity ? Number(capacity) : 50,
      organization
    });

    await logAuditAction({
      action: 'CREATE_BRANCH',
      user: req.user,
      organization,
      details: `Created branch ${branch.name} (${branch.code})`
    });

    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }

    if (!canAccessTenant(req.user, branch.organization)) {
      return res.status(403).json({ message: 'Access denied: Cross-organization branch modification forbidden' });
    }

    Object.assign(branch, req.body);
    await branch.save();

    await logAuditAction({
      action: 'UPDATE_BRANCH',
      user: req.user,
      organization: branch.organization,
      details: `Updated branch ${branch.name}`
    });

    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBranches, createBranch, updateBranch };
