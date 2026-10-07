const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id)
        .select('-password')
        .populate('branch')
        .populate('organization');

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

/**
 * Multi-Tenancy and Branch Scope Middleware
 * Enforces organization and branch boundaries automatically derived from authenticated user token.
 * Client-supplied organization or branch IDs are strictly validated and cannot override user authority.
 */
const branchScope = (req, res, next) => {
  if (!req.user) return next();

  // Multi-Tenancy Scoping: if user belongs to an organization, scope queries to that organization
  const tenantFilter = {};
  if (req.user.organization) {
    tenantFilter.organization = req.user.organization._id || req.user.organization;
  }
  req.tenantFilter = tenantFilter;

  // Branch Scoping
  if (['Super Admin', 'Fleet Manager', 'Finance Officer'].includes(req.user.role)) {
    // These roles can query across their organization's branches, or filter by a specific branch
    req.branchFilter = req.query.branchId 
      ? { ...tenantFilter, branch: req.query.branchId } 
      : { ...tenantFilter };
  } else {
    // Branch Manager and Driver are strictly scoped to their assigned branch
    if (req.user.branch) {
      const branchId = req.user.branch._id || req.user.branch;
      req.branchFilter = { ...tenantFilter, branch: branchId };
    } else {
      req.branchFilter = { ...tenantFilter };
    }
  }

  next();
};

/**
 * Helper to verify that a resource belongs to the user's authorized branch
 */
const canAccessBranch = (user, resourceBranchId) => {
  if (!user) return false;
  if (['Super Admin', 'Fleet Manager', 'Finance Officer'].includes(user.role)) return true;
  if (!resourceBranchId) return true;
  
  const userBranchId = user.branch ? (user.branch._id || user.branch).toString() : null;
  const targetBranchId = (resourceBranchId._id || resourceBranchId).toString();
  return userBranchId === targetBranchId;
};

/**
 * Helper to verify that a resource belongs to the user's authorized organization (SaaS boundary)
 */
const canAccessTenant = (user, resourceOrgId) => {
  if (!user) return false;
  // If user has no organization set, allow access in legacy single-tenant mode
  const userOrgId = user.organization ? (user.organization._id || user.organization).toString() : null;
  if (!userOrgId || !resourceOrgId) return true;
  
  const targetOrgId = (resourceOrgId._id || resourceOrgId).toString();
  return userOrgId === targetOrgId;
};

module.exports = {
  protect,
  authorize,
  branchScope,
  canAccessBranch,
  canAccessTenant
};
