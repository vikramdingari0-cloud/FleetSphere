const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'Toll Fees',
      'Parking',
      'Driver Allowance',
      'Insurance',
      'Licensing & Permits',
      'Vehicle Wash',
      'Spare Parts',
      'Emergency Repair',
      'Miscellaneous'
    ],
    required: true
  },
  amount: { type: Number, required: true },
  date: { type: Date, required: true, default: Date.now },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  receiptUrl: { type: String },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
