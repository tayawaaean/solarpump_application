const express = require('express');
const router = express.Router();
const controller = require('../controllers/gasPriceController');

// Public endpoints for getting prices
router.get('/gasoline', controller.getPhilippinesGasoline);
router.get('/diesel', controller.getPhilippinesDiesel);

// Protected update endpoint (add authentication middleware as needed)
router.patch('/update', controller.updateFuelPrice);

module.exports = router;