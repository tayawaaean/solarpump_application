const mongoose = require('mongoose');

const ElectricityPriceSchema = new mongoose.Schema({
  price: { type: Number, required: true }, // PHP per kWh
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ElectricityPrice', ElectricityPriceSchema);