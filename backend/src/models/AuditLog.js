const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName: { type: String },
  userRole: { type: String },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  details: { type: String },
  ipAddress: { type: String, default: '127.0.0.1' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
