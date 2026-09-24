const AuditLog = require('../models/AuditLog');

const logAuditAction = async ({ action, user, details, branch }) => {
  try {
    await AuditLog.create({
      action,
      user: user ? user._id : null,
      userName: user ? user.name : 'System',
      userRole: user ? user.role : 'System',
      branch: branch || (user ? user.branch : null),
      details,
      timestamp: new Date()
    });
  } catch (err) {
    console.error(`[Audit Log Failed] ${err.message}`);
  }
};

module.exports = logAuditAction;
