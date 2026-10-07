const AuditLog = require('../models/AuditLog');

const logAuditAction = async ({ action, user, details, branch, organization }) => {
  try {
    await AuditLog.create({
      action,
      user: user ? user._id : null,
      userName: user ? user.name : 'System',
      userRole: user ? user.role : 'System',
      branch: branch || (user ? (user.branch?._id || user.branch) : null),
      organization: organization || (user ? (user.organization?._id || user.organization) : null),
      details,
      timestamp: new Date()
    });
  } catch (err) {
    console.error(`[Audit Log Failed] ${err.message}`);
  }
};

module.exports = logAuditAction;
