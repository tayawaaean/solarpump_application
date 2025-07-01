require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors'); // ✅ Added CORS
const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');
const dataRoutes = require('./routes/dataRoutes');
const authRoutes = require('./routes/authRoutes');
const gasPriceRoutes = require('./routes/gasPriceRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
require('./mqtt/mqttClient');

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS: Allow frontend (Vite)
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ✅ Parse JSON requests
app.use(bodyParser.json());

// ✅ Log every request
app.use(requestLogger);

// ✅ Routes
app.use('/api/data', dataRoutes); // Protected
app.use('/api/auth', authRoutes); // Public
app.use('/api/gasprice', gasPriceRoutes); // New endpoint: /api/gasprice/philippines
app.use('/api/currency', currencyRoutes);



// ✅ Root test route
app.get('/', (req, res) => {
  res.send('🚀 Solar Pump API is running');
});

// ✅ MongoDB connect
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => logger.info('✅ MongoDB connected'))
.catch((err) => logger.error(`❌ MongoDB connection error: ${err.message}`));

// ✅ Start server
app.listen(PORT, () => {
  logger.info(`🚀 Server running at http://localhost:${PORT}`);
});
