// // src/routes/analyticsRoutes.js

// const express = require('express');
// const analyticsController = require('../controllers/analyticsController');

// const router = express.Router();

// // GET /api/analytics/average-price?coin=BTC
// router.get('/average-price', analyticsController.getAveragePrice);

// // GET /api/analytics/total-volume?coin=BTC
// router.get('/total-volume', analyticsController.getTotalVolume);

// // GET /api/analytics/recent-data?coin=BTC&limit=100
// router.get('/recent-data', analyticsController.getRecentData);

// // Add more routes as needed

// module.exports = router;

// src/routes/analyticsRoutes.js

const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");

/**
 * GET /api/analytics/historical-data?coin=BTC&limit=100
 */
router.get("/historical-data", analyticsController.getRecentData);

/**
 * GET /api/analytics/bollinger-bands?coin=BTC&period=20&stdDev=2
 */
router.get("/bollinger-bands", analyticsController.getBollingerBands);

/**
 * GET /api/analytics/average-price?coin=BTC
 */
router.get("/average-price", analyticsController.getAveragePrice);

/**
 * GET /api/analytics/total-volume?coin=BTC
 */
router.get("/total-volume", analyticsController.getTotalVolume);

/**
 * GET /api/analytics/moving-average?coin=BTC&period=20
 */
router.get("/moving-average", analyticsController.getMovingAverage);

// Add more routes as needed for future analytics techniques
// /api/analytics/average_true_range
router.get("/average_true_range/", analyticsController.getAverageTrueRange)

router.get("/historical_volatility/", analyticsController.getHistoricalVolatile)

router.get("/get_candle_data", analyticsController.getCandleData);
module.exports = router;
