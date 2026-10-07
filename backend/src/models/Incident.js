const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  incidentNumber: { type: String, required: true, unique: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  dateTime: { type: Date, required: true, default: Date.now },
  location: { type: String, required: true },
  severity: {
    type: String,
    enum: ['Minor', 'Moderate', 'Severe', 'Critical'],
    required: true
  },
  description: { type: String, required: true },
  evidenceFiles: [{ type: String }],
  investigationNotes: { type: String },
  status: {
    type: String,
    enum: ['Reported', 'Under Investigation', 'Action Required', 'Resolved', 'Closed'],
    default: 'Reported'
  },
  actionTaken: { type: String },
  estimatedLossAmount: { type: Number, default: 0 },
  insuranceClaimed: { type: Boolean, default: false },
  insuranceClaimDetails: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Incident', incidentSchema);
