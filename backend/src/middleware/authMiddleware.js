const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fleetsphere_secret');

      req.user = await User.findById(decoded.id).select('-password').populate('branch');

      if (!req.user || !req.user.isActive) {
        return res.status(401).json({ message: 'User account deactivated or not found' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role '${req.user ? req.user.role : 'Guest'}' is not authorized to access this resource`
      });
    }
    next();
  };
};

const branchScope = (req, res, next) => {
  if (!req.user) return next();

  // Super Admin, Fleet Manager, and Finance Officer get global access unless explicit query param is passed
  if (['Super Admin', 'Fleet Manager', 'Finance Officer'].includes(req.user.role)) {
    req.branchFilter = req.query.branchId ? { branch: req.query.branchId } : {};
  } else {
    // Branch Manager and Driver are scoped strictly to their assigned branch
    if (req.user.branch) {
      const branchId = req.user.branch._id || req.user.branch;
      req.branchFilter = { branch: branchId };
    } else {
      req.branchFilter = {};
    }
  }
  next();
};

module.exports = { protect, authorize, branchScope };
