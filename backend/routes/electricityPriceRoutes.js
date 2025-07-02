const express = require('express');
const router = express.Router();
const auth = require('../auth/authMiddleware');
const { getElectricityPrice, updateElectricityPrice } = require('../controllers/electricityPriceController');

// Public: Get current electricity price
router.get('/', getElectricityPrice);

// Protected: Update electricity price (admin only, or add necessary middleware)
router.patch('/update', auth, updateElectricityPrice);

module.exports = router;