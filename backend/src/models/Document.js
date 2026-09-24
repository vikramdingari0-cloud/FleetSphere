const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  documentType: {
    type: String,
    enum: [
      'Vehicle Registration',
      'Vehicle Insurance',
      'Road Permit',
      'Emission Certificate',
      'Driver License Scan',
      'Medical Clearance',
      'Trip Waybill',
      'Maintenance Receipt',
      'Other'
    ],
    required: true
  },
  entityType: {
    type: String,
    enum: ['Vehicle', 'Driver', 'Trip', 'Branch', 'Organization'],
    required: true
  },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  fileUrl: { type: String, required: true },
  issueDate: { type: Date },
  expiryDate: { type: Date },
  status: {
    type: String,
    enum: ['Valid', 'Expiring Soon', 'Expired'],
    default: 'Valid'
  },
  notes: { type: String }
}, { timestamps: true });

documentSchema.pre('save', function (next) {
  if (this.expiryDate) {
    const today = new Date();
    const expiry = new Date(this.expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) {
      this.status = 'Expired';
    } else if (diffDays <= 30) {
      this.status = 'Expiring Soon';
    } else {
      this.status = 'Valid';
    }
  }
  next();
});

module.exports = mongoose.model('Document', documentSchema);
