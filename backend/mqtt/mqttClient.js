// mqtt/mqttClient.js
const mqtt = require('mqtt');
const SensorData = require('../models/SensorData');
const logger = require('../config/logger');

const client = mqtt.connect(process.env.MQTT_BROKER, {
  username: process.env.MQTT_USER,
  password: process.env.MQTT_PASSWORD
});

client.on('connect', () => {
  logger.info('Connected to MQTT broker');
  client.subscribe(process.env.MQTT_TOPIC, (err) => {
    if (err) logger.error(`MQTT Subscribe Error: ${err.message}`);
    else logger.info(`Subscribed to topic: ${process.env.MQTT_TOPIC}`);
  });
});

client.on('message', async (topic, message) => {
  try {
    const payload = JSON.parse(message.toString());
    payload.time = new Date(payload.time);
    const entry = new SensorData(payload);
    await entry.save();
    logger.info(`Sensor data saved at ${payload.time.toISOString()}`);
  } catch (err) {
    logger.error(`Error processing MQTT message: ${err.message}`);
  }
});

module.exports = client;
