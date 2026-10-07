const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  subscriptionPlan: {
    type: String,
    enum: ['Starter', 'Professional', 'Enterprise'],
    default: 'Enterprise'
  },
  status: {
    type: String,
    enum: ['Active', 'Suspended', 'Trial'],
    default: 'Active'
  },
  contactEmail: { type: String, trim: true, lowercase: true },
  contactPhone: { type: String },
  address: { type: String },
  settings: {
    currency: { type: String, default: 'USD' },
    distanceUnit: { type: String, default: 'km' },
    timezone: { type: String, default: 'America/Chicago' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
