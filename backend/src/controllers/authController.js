const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logAuditAction = require('../utils/auditLogger');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fleetsphere_secret', {
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

    const user = await User.findOne({ email }).populate('branch');

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
      details: `User logged in from ${req.ip}`
    });

    res.json({
      token: generateToken(user._id),
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
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
    const user = await User.findById(req.user._id).select('-password').populate('branch');
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

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      branch: branch || null,
      phone
    });

    await logAuditAction({
      action: 'CREATE_USER',
      user: req.user,
      details: `Created new user ${user.name} (${user.role})`
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get Users (Admin/Manager view)
// @route GET /api/auth/users
const getUsers = async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'Branch Manager' && req.user.branch) {
      filter.branch = req.user.branch._id || req.user.branch;
    }
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter).select('-password').populate('branch').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  loginUser,
  getMe,
  createUser,
  getUsers
};
