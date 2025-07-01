// controllers/dataController.js
const SensorData = require('../models/SensorData');
const logger = require('../config/logger');

exports.getLatestData = async (req, res) => {
  try {
    const data = await SensorData.find().sort({ time: -1 }).limit(100);
    res.json(data);
  } catch (err) {
    logger.error(`Failed to fetch data: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get the most recent data point (real-time)
exports.getRealtimeData = async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ time: -1 });
    res.json(data);
  } catch (err) {
    logger.error(`Failed to fetch realtime data: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper for aggregation
function getAggregationPipeline(groupFormat, dateField = "$time") {
  return [
    {
      $group: {
        _id: { $dateToString: { format: groupFormat, date: dateField } },
        avg_current: { $avg: "$filtered_current" },
        avg_voltage: { $avg: "$filtered_voltage" },
        avg_power: { $avg: "$power" },
        total_flow: { $sum: "$flow" },
        total_energy_wh: { $max: "$accumulated_energy_wh" },
        first: { $first: "$$ROOT" },
        last: { $last: "$$ROOT" }
      }
    },
    { $sort: { _id: 1 } }
  ];
}

// Hourly aggregation for the last 24 hours
exports.getHourlyData = async (req, res) => {
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const pipeline = [
      { $match: { time: { $gte: since } } },
      ...getAggregationPipeline("%Y-%m-%d %H:00")
    ];
    const data = await SensorData.aggregate(pipeline);
    res.json(data);
  } catch (err) {
    logger.error(`Failed to fetch hourly data: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Daily aggregation for the last 30 days
exports.getDailyData = async (req, res) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const pipeline = [
      { $match: { time: { $gte: since } } },
      ...getAggregationPipeline("%Y-%m-%d")
    ];
    const data = await SensorData.aggregate(pipeline);
    res.json(data);
  } catch (err) {
    logger.error(`Failed to fetch daily data: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Weekly aggregation for the last 12 weeks
exports.getWeeklyData = async (req, res) => {
  try {
    const since = new Date(Date.now() - 12 * 7 * 24 * 60 * 60 * 1000);
    const pipeline = [
      { $match: { time: { $gte: since } } },
      ...getAggregationPipeline("%G-%V") // ISO week: %G=year, %V=week
    ];
    const data = await SensorData.aggregate(pipeline);
    res.json(data);
  } catch (err) {
    logger.error(`Failed to fetch weekly data: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Monthly aggregation for the last 12 months
exports.getMonthlyData = async (req, res) => {
  try {
    const since = new Date();
    since.setMonth(since.getMonth() - 12);
    const pipeline = [
      { $match: { time: { $gte: since } } },
      ...getAggregationPipeline("%Y-%m")
    ];
    const data = await SensorData.aggregate(pipeline);
    res.json(data);
  } catch (err) {
    logger.error(`Failed to fetch monthly data: ${err.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
};