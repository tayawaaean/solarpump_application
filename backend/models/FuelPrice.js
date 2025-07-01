const mongoose = require('mongoose');
const FuelPriceSchema = new mongoose.Schema({
  type: { type: String, enum: ['gasoline', 'diesel'], required: true, unique: true },
  price: { type: Number, required: true }, // In USD per liter
  updatedAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('FuelPrice', FuelPriceSchema);