// src/controllers/analyticsController.js

const singlestoreService = require('../services/singlestoreService');

/**
 * Handles fetching the average close price for a specific coin.
 */
const getAveragePrice = async (req, res, next) => {
  const { coin } = req.query;

  if (!coin) {
    return res.status(400).json({ error: 'Coin parameter is required' });
  }

  try {
    const averagePrice = await singlestoreService.getAverageClosePrice(coin.toUpperCase());
    res.json({ average_close_price: averagePrice });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles fetching the total volume for a specific coin.
 */
const getTotalVolume = async (req, res, next) => {
  const { coin } = req.query;

  if (!coin) {
    return res.status(400).json({ error: 'Coin parameter is required' });
  }

  try {
    const totalVolume = await singlestoreService.getTotalVolume(coin.toUpperCase());
    res.json({ total_volume: totalVolume });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles fetching recent ticker data for a specific coin.
 */
const getRecentData = async (req, res, next) => {
  const { coin, limit } = req.query;
  const dataLimit = parseInt(limit, 10) || 100;

  if (!coin) {
    return res.status(400).json({ error: 'Coin parameter is required' });
  }

  try {
    const recentData = await singlestoreService.getRecentTickerData(coin.toUpperCase(), dataLimit);
    res.json(recentData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAveragePrice,
  getTotalVolume,
  getRecentData,
};
