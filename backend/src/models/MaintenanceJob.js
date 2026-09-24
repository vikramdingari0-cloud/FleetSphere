const mongoose = require('mongoose');

const maintenanceJobSchema = new mongoose.Schema({
  jobNumber: { type: String, required: true, unique: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  type: {
    type: String,
    enum: [
      'Scheduled Service',
      'Preventive Maintenance',
      'Corrective Repair',
      'Tire Replacement',
      'Oil & Filter Change',
      'Inspection',
      'Emergency Breakdown'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  scheduledDate: { type: Date, required: true },
  scheduledOdometer: { type: Number },
  completedDate: { type: Date },
  completedOdometer: { type: Number },
  estimatedCost: { type: Number, default: 0 },
  actualCost: { type: Number, default: 0 },
  serviceProvider: { type: String },
  workDescription: { type: String, required: true },
  partsReplaced: [{ type: String }],
  performedBy: { type: String },
  createdFromIncident: { type: mongoose.Schema.Types.ObjectId, ref: 'Incident' }
}, { timestamps: true });

module.exports = mongoose.model('MaintenanceJob', maintenanceJobSchema);
