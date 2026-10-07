const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vin: { type: String, required: true, unique: true, uppercase: true, trim: true },
  plateNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  type: {
    type: String,
    enum: ['Heavy Duty Truck', 'Delivery Van', 'Cargo Semi', 'Electric Van', 'Sedan Fleet', 'Pickup 4x4'],
    required: true
  },
  fuelType: {
    type: String,
    enum: ['Diesel', 'Gasoline', 'Electric', 'Hybrid', 'CNG'],
    default: 'Diesel'
  },
  fuelCapacity: { type: Number, required: true }, // Liters or kWh
  currentOdometer: { type: Number, required: true, default: 0 },
  status: {
    type: String,
    enum: ['Available', 'In Transit', 'Maintenance', 'Out of Service'],
    default: 'Available'
  },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  serviceIntervalKm: { type: Number, default: 10000 },
  serviceIntervalMonths: { type: Number, default: 6 },
  lastServiceDate: { type: Date },
  lastServiceOdometer: { type: Number, default: 0 },
  nextServiceDueKm: { type: Number },
  nextServiceDueDate: { type: Date },
  isOverdueForService: { type: Boolean, default: false }
}, { timestamps: true });

vehicleSchema.pre('save', function (next) {
  if (this.lastServiceOdometer !== undefined && this.serviceIntervalKm) {
    this.nextServiceDueKm = this.lastServiceOdometer + this.serviceIntervalKm;
  }
  if (this.currentOdometer && this.nextServiceDueKm && this.currentOdometer >= this.nextServiceDueKm) {
    this.isOverdueForService = true;
  } else if (this.nextServiceDueDate && new Date() >= new Date(this.nextServiceDueDate)) {
    this.isOverdueForService = true;
  } else {
    this.isOverdueForService = false;
  }
  next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
