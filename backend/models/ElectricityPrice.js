const mongoose = require('mongoose');

const ElectricityPriceSchema = new mongoose.Schema({
  pricePerKwh: { type: Number, default: 10 },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ElectricityPrice', ElectricityPriceSchema);