// models/SensorData.js
const mongoose = require('mongoose');
const SensorDataSchema = new mongoose.Schema({
  time: { type: Date, required: true },
  adc_current: Number,
  adc_voltage: Number,
  raw_current: Number,
  raw_voltage: Number,
  filtered_current: Number,
  filtered_voltage: Number,
  flow: Number,
  power: Number,
  accumulated_energy_wh: Number,
  filter_initialized: Boolean
});
module.exports = mongoose.model('SensorData', SensorDataSchema);