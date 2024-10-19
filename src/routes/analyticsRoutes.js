// src/routes/analyticsRoutes.js

const express = require('express');
const analyticsController = require('../controllers/analyticsController');

const router = express.Router();

// GET /api/analytics/average-price?coin=BTC
router.get('/average-price', analyticsController.getAveragePrice);

// GET /api/analytics/total-volume?coin=BTC
router.get('/total-volume', analyticsController.getTotalVolume);

// GET /api/analytics/recent-data?coin=BTC&limit=100
router.get('/recent-data', analyticsController.getRecentData);

// Add more routes as needed

module.exports = router;
