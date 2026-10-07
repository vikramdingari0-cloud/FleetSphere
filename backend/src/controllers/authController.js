const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logAuditAction = require('../utils/auditLogger');
const { canAccessBranch, canAccessTenant } = require('../middleware/authMiddleware');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// @desc Login user
// @route POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).populate('branch').populate('organization');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account is deactivated' });
    }

    user.lastLogin = new Date();
    await user.save();

    await logAuditAction({
      action: 'USER_LOGIN',
      user,
      details: `User logged in from ${req.ip || '127.0.0.1'}`
    });

    res.json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        organization: user.organization,
        phone: user.phone,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get Current User profile
// @route GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('branch')
      .populate('organization');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Register/Create User
// @route POST /api/auth/users
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, branch, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password, and role are required' });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    let targetBranch = branch;
    if (req.user.role === 'Branch Manager') {
      targetBranch = req.user.branch ? (req.user.branch._id || req.user.branch) : null;
    }

    const organization = req.user.organization ? (req.user.organization._id || req.user.organization) : null;

    const user = await User.create({
      name,
      email,
      password,
      role,
      branch: targetBranch || null,
      organization,
      phone
    });

    await logAuditAction({
      action: 'CREATE_USER',
      user: req.user,
      organization,
      details: `Created new user ${user.name} (${user.role})`
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
      organization: user.organization
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get Users (Admin/Manager view with tenancy)
// @route GET /api/auth/users
const getUsers = async (req, res) => {
  try {
    let filter = {};

    if (req.user.organization) {
      filter.organization = req.user.organization._id || req.user.organization;
    }

    if (req.user.role === 'Branch Manager' && req.user.branch) {
      filter.branch = req.user.branch._id || req.user.branch;
    }

    if (req.query.role && req.query.role !== 'ALL') {
      filter.role = req.query.role;
    }

    const users = await User.find(filter)
      .select('-password')
      .populate('branch')
      .populate('organization')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update user account details or status
// @route PUT /api/auth/users/:id
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!canAccessTenant(req.user, user.organization)) {
      return res.status(403).json({ message: 'Access denied: Cross-organization user modification forbidden' });
    }

    const { name, phone, role, branch, isActive, avatar } = req.body;
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (role && ['Super Admin', 'Fleet Manager'].includes(req.user.role)) user.role = role;
    if (branch !== undefined && ['Super Admin', 'Fleet Manager'].includes(req.user.role)) user.branch = branch;
    if (isActive !== undefined && ['Super Admin', 'Fleet Manager'].includes(req.user.role)) user.isActive = isActive;
    if (avatar) user.avatar = avatar;

    await user.save();

    await logAuditAction({
      action: 'UPDATE_USER',
      user: req.user,
      organization: user.organization,
      details: `Updated user profile for ${user.name}`
    });

    const populated = await User.findById(user._id).select('-password').populate('branch').populate('organization');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  loginUser,
  getMe,
  createUser,
  getUsers,
  updateUser
};
