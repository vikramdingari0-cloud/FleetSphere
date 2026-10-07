const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripNumber: { type: String, required: true, unique: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  estimatedDistanceKm: { type: Number, required: true },
  actualDistanceKm: { type: Number },
  plannedDepartureTime: { type: Date, required: true },
  plannedArrivalTime: { type: Date, required: true },
  actualDepartureTime: { type: Date },
  actualArrivalTime: { type: Date },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  cargoDetails: { type: String },
  cargoWeightKg: { type: Number },
  status: {
    type: String,
    enum: ['Planned', 'Assigned', 'Started', 'Delayed', 'Completed', 'Cancelled'],
    default: 'Planned'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: String,
    location: String
  }],
  delayReason: { type: String },
  startOdometer: { type: Number },
  endOdometer: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);
