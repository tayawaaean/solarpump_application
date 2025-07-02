const ElectricityPrice = require('../models/ElectricityPrice');

exports.getElectricityPrice = async (req, res) => {
  let price = await ElectricityPrice.findOne();
  if (!price) price = await ElectricityPrice.create({}); // uses default 10
  res.json(price);
};

exports.updateElectricityPrice = async (req, res) => {
  const { pricePerKwh } = req.body;
  if (typeof pricePerKwh !== 'number' || pricePerKwh <= 0) {
    return res.status(400).json({ error: 'Invalid pricePerKwh' });
  }
  const updated = await ElectricityPrice.findOneAndUpdate(
    {},
    { pricePerKwh, updatedAt: new Date() },
    { upsert: true, new: true }
  );
  res.json(updated);
};