const mongoose = require('mongoose');

const fuelEntrySchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Driver', required: true },
  trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  date: { type: Date, required: true, default: Date.now },
  odometerReading: { type: Number, required: true },
  fuelVolumeLiters: { type: Number, required: true },
  unitPrice: { type: Number, required: true },
  totalCost: { type: Number, required: true },
  fuelStation: { type: String },
  isFullTank: { type: Boolean, default: true },
  receiptNumber: { type: String },
  calculatedEfficiencyKmPerL: { type: Number }
}, { timestamps: true });

fuelEntrySchema.pre('save', function (next) {
  if (this.fuelVolumeLiters && this.unitPrice && !this.totalCost) {
    this.totalCost = Number((this.fuelVolumeLiters * this.unitPrice).toFixed(2));
  }
  next();
});

module.exports = mongoose.model('FuelEntry', fuelEntrySchema);
