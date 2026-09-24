const Branch = require('../models/Branch');
const logAuditAction = require('../utils/auditLogger');

const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
    res.json(branches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createBranch = async (req, res) => {
  try {
    const { name, code, city, address, contactPhone, contactEmail, capacity } = req.body;

    const existing = await Branch.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: `Branch code '${code}' already exists` });
    }

    const branch = await Branch.create({
      name,
      code: code.toUpperCase(),
      city,
      address,
      contactPhone,
      contactEmail,
      capacity
    });

    await logAuditAction({
      action: 'CREATE_BRANCH',
      user: req.user,
      details: `Created branch ${branch.name} (${branch.code})`
    });

    res.status(201).json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found' });
    }
    await logAuditAction({
      action: 'UPDATE_BRANCH',
      user: req.user,
      details: `Updated branch ${branch.name}`
    });
    res.json(branch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getBranches, createBranch, updateBranch };
