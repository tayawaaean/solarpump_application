const mongoose = require('mongoose');

const FuelPriceSchema = new mongoose.Schema({
  type: { type: String, enum: ['gasoline', 'diesel', 'electricity'], required: true, unique: true },
  // Store price in PHP for gasoline & diesel, PHP/kWh for electricity
  price: { type: Number, required: true, default: function() {
    return this.type === 'electricity' ? 10 : undefined;
  }},
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FuelPrice', FuelPriceSchema);