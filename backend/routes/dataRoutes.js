// routes/dataRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../auth/authMiddleware');
const {
  getLatestData,
  getRealtimeData,
  getHourlyData,
  getDailyData,
  getWeeklyData,
  getMonthlyData
} = require('../controllers/dataController');

router.get('/', auth, getLatestData);
router.get('/realtime', auth, getRealtimeData);
router.get('/hourly', auth, getHourlyData);
router.get('/daily', auth, getDailyData);
router.get('/weekly', auth, getWeeklyData);
router.get('/monthly', auth, getMonthlyData);

module.exports = router;