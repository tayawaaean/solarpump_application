const express = require('express');
const router = express.Router();
const { getUsdToPhp } = require('../controllers/currencyController');

router.get('/usd-to-php', getUsdToPhp);

module.exports = router;