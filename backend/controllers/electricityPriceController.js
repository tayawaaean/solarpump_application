const ElectricityPrice = require('../models/ElectricityPrice');

// Get current electricity price (latest document)
exports.getElectricityPrice = async (req, res) => {
  try {
    const priceEntry = await ElectricityPrice.findOne().sort({ updatedAt: -1 });
    res.json({ price: priceEntry ? priceEntry.price : null });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch electricity price' });
  }
};

// Update electricity price (add new document)
exports.updateElectricityPrice = async (req, res) => {
  try {
    const { price } = req.body;
    if (typeof price !== 'number' || price < 0) {
      return res.status(400).json({ error: "Invalid price" });
    }
    const newEntry = await ElectricityPrice.create({ price });
    res.json({ price: newEntry.price });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update electricity price' });
  }
};