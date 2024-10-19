// // src/controllers/analyticsController.js

// const singlestoreService = require('../services/singlestoreService');

// /**
//  * Handles fetching the average close price for a specific coin.
//  */
// const getAveragePrice = async (req, res, next) => {
//   const { coin } = req.query;

//   if (!coin) {
//     return res.status(400).json({ error: 'Coin parameter is required' });
//   }

//   try {
//     const averagePrice = await singlestoreService.getAverageClosePrice(coin.toUpperCase());
//     res.json({ average_close_price: averagePrice });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Handles fetching the total volume for a specific coin.
//  */
// const getTotalVolume = async (req, res, next) => {
//   const { coin } = req.query;

//   if (!coin) {
//     return res.status(400).json({ error: 'Coin parameter is required' });
//   }

//   try {
//     const totalVolume = await singlestoreService.getTotalVolume(coin.toUpperCase());
//     res.json({ total_volume: totalVolume });
//   } catch (error) {
//     next(error);
//   }
// };

// /**
//  * Handles fetching recent ticker data for a specific coin.
//  */
// const getRecentData = async (req, res, next) => {
//   const { coin, limit } = req.query;
//   const dataLimit = parseInt(limit, 10) || 100;

//   if (!coin) {
//     return res.status(400).json({ error: 'Coin parameter is required' });
//   }

//   try {
//     const recentData = await singlestoreService.getRecentTickerData(coin.toUpperCase(), dataLimit);
//     res.json(recentData);
//   } catch (error) {
//     next(error);
//   }
// };

// module.exports = {
//   getAveragePrice,
//   getTotalVolume,
//   getRecentData,
// };

// src/controllers/analyticsController.js

const singlestoreService = require('../services/singlestoreService');
const logger = require('../utils/logger');

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

    if (averagePrice === null) {
      return res.status(404).json({ error: `No data found for coin: ${coin.toUpperCase()}` });
    }

    res.json({ average_close_price: averagePrice });
  } catch (error) {
    logger.error(`Error fetching average price for ${coin.toUpperCase()}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
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

    if (totalVolume === null) {
      return res.status(404).json({ error: `No data found for coin: ${coin.toUpperCase()}` });
    }

    res.json({ total_volume: totalVolume });
  } catch (error) {
    logger.error(`Error fetching total volume for ${coin.toUpperCase()}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
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

    if (!recentData || recentData.length === 0) {
      return res.status(404).json({ error: `No recent data found for coin: ${coin.toUpperCase()}` });
    }

    res.json({ recent_data: recentData });
  } catch (error) {
    logger.error(`Error fetching recent data for ${coin.toUpperCase()}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Handles calculating and fetching Bollinger Bands for a specific coin.
 */
const getBollingerBands = async (req, res, next) => {
  const { coin, period = 20, stdDev = 2 } = req.query;

  if (!coin) {
    return res.status(400).json({ error: 'Coin parameter is required' });
  }

  // Validate that period and stdDev are positive numbers
  const periodNum = parseInt(period, 10);
  const stdDevNum = parseFloat(stdDev);

  if (isNaN(periodNum) || periodNum <= 0) {
    return res.status(400).json({ error: 'Period must be a positive integer' });
  }

  if (isNaN(stdDevNum) || stdDevNum <= 0) {
    return res.status(400).json({ error: 'Standard Deviation multiplier must be a positive number' });
  }

  try {
    const bollingerBands = await singlestoreService.getBollingerBands(
      coin.toUpperCase(),
      periodNum,
      stdDevNum
    );

    if (!bollingerBands) {
      return res.status(404).json({ error: `Not enough data to calculate Bollinger Bands for ${coin.toUpperCase()}` });
    }

    res.json({
      coin: coin.toUpperCase(),
      period: periodNum,
      stdDev: stdDevNum,
      bollinger_bands: bollingerBands,
    });
  } catch (error) {
    logger.error(`Error calculating Bollinger Bands for ${coin.toUpperCase()}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

/**
 * Handles calculating and fetching Moving Average for a specific coin.
 * Placeholder for future analytics techniques.
 */
const getMovingAverage = async (req, res, next) => {
  const { coin, period = 20 } = req.query;

  if (!coin) {
    return res.status(400).json({ error: 'Coin parameter is required' });
  }

  const periodNum = parseInt(period, 10);

  if (isNaN(periodNum) || periodNum <= 0) {
    return res.status(400).json({ error: 'Period must be a positive integer' });
  }

  try {
    const movingAverage = await singlestoreService.getMovingAverage(
      coin.toUpperCase(),
      periodNum
    );

    if (movingAverage === null) {
      return res.status(404).json({ error: `Not enough data to calculate Moving Average for ${coin.toUpperCase()}` });
    }

    res.json({
      coin: coin.toUpperCase(),
      period: periodNum,
      moving_average: movingAverage,
    });
  } catch (error) {
    logger.error(`Error calculating Moving Average for ${coin.toUpperCase()}:`, error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
  getAveragePrice,
  getTotalVolume,
  getRecentData,
  getBollingerBands,    // Newly added controller method
  getMovingAverage,    // Newly added controller method for future use
};
