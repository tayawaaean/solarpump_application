const express = require('express');
const router = express.Router();
const controller = require('../controllers/electricityPriceController');

router.get('/', controller.getElectricityPrice);
router.patch('/update', controller.updateElectricityPrice);

module.exports = router;