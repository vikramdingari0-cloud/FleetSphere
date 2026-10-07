const Organization = require('../models/Organization');
const logAuditAction = require('../utils/auditLogger');

// @desc Get organization details or list (Super Admin)
// @route GET /api/organizations
const getOrganizations = async (req, res) => {
  try {
    let query = {};
    // If not global super-admin or scoped to org
    if (req.user.organization && req.user.role !== 'Super Admin') {
      query._id = req.user.organization._id || req.user.organization;
    }
    const orgs = await Organization.find(query).sort({ name: 1 });
    res.json(orgs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get organization by ID
// @route GET /api/organizations/:id
const getOrganizationById = async (req, res) => {
  try {
    const org = await Organization.findById(req.params.id);
    if (!org) return res.status(404).json({ message: 'Organization not found' });
    res.json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create new organization (Super Admin)
// @route POST /api/organizations
const createOrganization = async (req, res) => {
  try {
    const { name, code, subscriptionPlan, contactEmail, contactPhone, address, settings } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: 'Organization name and code are required' });
    }

    const existing = await Organization.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ message: `Organization code '${code}' is already registered` });
    }

    const org = await Organization.create({
      name,
      code: code.toUpperCase(),
      subscriptionPlan: subscriptionPlan || 'Enterprise',
      contactEmail,
      contactPhone,
      address,
      settings: settings || {}
    });

    await logAuditAction({
      action: 'CREATE_ORGANIZATION',
      user: req.user,
      organization: org._id,
      details: `Onboarded enterprise organization ${org.name} (${org.code})`
    });

    res.status(201).json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update organization details
// @route PUT /api/organizations/:id
const updateOrganization = async (req, res) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!org) return res.status(404).json({ message: 'Organization not found' });

    await logAuditAction({
      action: 'UPDATE_ORGANIZATION',
      user: req.user,
      organization: org._id,
      details: `Updated organization settings for ${org.name}`
    });

    res.json(org);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization
};
