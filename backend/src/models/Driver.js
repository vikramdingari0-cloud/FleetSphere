const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  licenseNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  licenseClass: { type: String, required: true }, // e.g. Class A, Commercial Heavy
  licenseExpiryDate: { type: Date, required: true },
  medicalCertExpiryDate: { type: Date },
  drivingExperienceYears: { type: Number, default: 3 },
  safetyRating: { type: Number, default: 4.8 },
  status: {
    type: String,
    enum: ['Available', 'On Duty', 'Off Duty', 'Suspended'],
    default: 'Available'
  },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  totalTripsCompleted: { type: Number, default: 0 },
  totalDistanceDrivenKm: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
