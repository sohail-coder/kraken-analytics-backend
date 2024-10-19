// // src/services/singlestoreService.js

// const pool = require('../config/dbConfig');

// /**
//  * Executes a SQL query with parameters.
//  * @param {string} query - The SQL query to execute.
//  * @param {Array} params - The parameters for the SQL query.
//  * @returns {Promise<Array>} - The result rows.
//  */
// const execute = async (query, params) => {
//     try {
//       const [rows, fields] = await pool.execute(query, params);
//       return rows;
//     } catch (error) {
//       throw error;
//     }
//   };

// /**
//  * Fetches the average close price for a specific coin over the last 24 hours.
//  * @param {string} coin - The cryptocurrency symbol (e.g., BTC).
//  * @returns {Promise<number>} - The average close price.
//  */
// const getAverageClosePrice = async (coin) => {
//   const query = `
//     SELECT AVG(close_price) AS average_close_price
//     FROM ticker
//     WHERE coin = ?
//       AND received_at >= NOW() - INTERVAL 24 HOUR
//   `;
//   const rows = await execute(query, [coin]);
//   return rows[0].average_close_price;
// };

// /**
//  * Fetches the total volume for a specific coin over the last 24 hours.
//  * @param {string} coin - The cryptocurrency symbol (e.g., BTC).
//  * @returns {Promise<number>} - The total volume.
//  */
// const getTotalVolume = async (coin) => {
//   const query = `
//     SELECT SUM(volume_last_24h) AS total_volume
//     FROM ticker
//     WHERE coin = ?
//       AND received_at >= NOW() - INTERVAL 24 HOUR
//   `;
//   const rows = await execute(query, [coin]);
//   return rows[0].total_volume;
// };

// /**
//  * Fetches recent ticker data for a specific coin.
//  * @param {string} coin - The cryptocurrency symbol (e.g., BTC).
//  * @param {number} limit - Number of records to fetch.
//  * @returns {Promise<Array>} - Array of ticker records.
//  */
// const getRecentTickerData = async (coin, limit = 100) => {
//   const query = `
//     SELECT *
//     FROM ticker
//     WHERE coin = ?
//     ORDER BY received_at DESC
//     LIMIT ?
//   `;
//   const rows = await execute(query, [coin, limit]);
//   return rows;
// };

// // Add more service functions as needed

// module.exports = {
//   execute,
//   getAverageClosePrice,
//   getTotalVolume,
//   getRecentTickerData,
// };

// src/services/singlestoreService.js

const pool = require("../config/dbConfig");

/**
 * Executes a SQL query with parameters.
 * @param {string} query - The SQL query to execute.
 * @param {Array} params - The parameters for the SQL query.
 * @returns {Promise<Array>} - The result rows.
 */
const execute = async (query, params) => {
  try {
    const [rows, fields] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    throw error;
  }
};

/**
 * Fetches the average close price for a specific coin over the last 24 hours.
 * @param {string} coin - The cryptocurrency symbol (e.g., BTC).
 * @returns {Promise<number|null>} - The average close price or null if no data.
 */
const getAverageClosePrice = async (coin) => {
  const query = `
    SELECT AVG(close_price) AS average_close_price
    FROM ticker
    WHERE coin = ?
      AND received_at >= NOW() - INTERVAL 24 HOUR
  `;
  const rows = await execute(query, [coin]);
  return rows[0].average_close_price || null;
};

/**
 * Fetches the total volume for a specific coin over the last 24 hours.
 * @param {string} coin - The cryptocurrency symbol (e.g., BTC).
 * @returns {Promise<number|null>} - The total volume or null if no data.
 */
const getTotalVolume = async (coin) => {
  const query = `
    SELECT SUM(volume_last_24h) AS total_volume
    FROM ticker
    WHERE coin = ?
      AND received_at >= NOW() - INTERVAL 24 HOUR
  `;
  const rows = await execute(query, [coin]);
  return rows[0].total_volume || null;
};

/**
 * Fetches recent ticker data for a specific coin.
 * @param {string} coin - The cryptocurrency symbol (e.g., BTC).
 * @param {number} limit - Number of records to fetch.
 * @returns {Promise<Array>} - Array of ticker records ordered ascending by received_at.
 */
const getRecentTickerData = async (coin, limit = 100) => {
  const query = `
    SELECT *
    FROM ticker
    WHERE coin = ?
    ORDER BY received_at ASC
    LIMIT ?
  `;
  const rows = await execute(query, [coin, limit]);
  return rows;
};

/**
 * Calculates Bollinger Bands for a specific coin.
 * @param {string} coin - The cryptocurrency symbol (e.g., BTC).
 * @param {number} period - The number of periods for SMA (e.g., 20).
 * @param {number} stdDevMultiplier - The standard deviation multiplier (e.g., 2).
 * @returns {Promise<Object|null>} - An object containing SMA, Upper Band, and Lower Band or null if insufficient data.
 */
const getBollingerBands = async (coin, period = 20, stdDevMultiplier = 2) => {
  // Validate that 'period' is a positive integer
  if (!Number.isInteger(period) || period <= 0) {
    throw new Error("Period must be a positive integer");
  }

  // Embed 'LIMIT' directly into the query after validation
  const query = `
    SELECT close_price
    FROM ticker
    WHERE coin = ?
    ORDER BY received_at ASC
    LIMIT ${period}
  `;

  try {
    const rows = await execute(query, [coin]);

    if (!rows || rows.length < period) {
      // Not enough data to calculate Bollinger Bands
      return null;
    }

    // Extract closing prices as numbers
    const closePrices = rows.map((row) => parseFloat(row.close_price));

    // Calculate Simple Moving Average (SMA)
    const sum = closePrices.reduce((acc, price) => acc + price, 0);
    const sma = sum / period;

    // Calculate Standard Deviation (SD)
    const variance =
      closePrices.reduce((acc, price) => acc + Math.pow(price - sma, 2), 0) /
      period;
    const standardDeviation = Math.sqrt(variance);

    // Calculate Upper and Lower Bollinger Bands
    const upperBand = sma + standardDeviation * stdDevMultiplier;
    const lowerBand = sma - standardDeviation * stdDevMultiplier;

    return {
      sma: parseFloat(sma.toFixed(2)),
      upperBand: parseFloat(upperBand.toFixed(2)),
      lowerBand: parseFloat(lowerBand.toFixed(2)),
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Calculates the Moving Average for a specific coin.
 * @param {string} coin - The cryptocurrency symbol (e.g., BTC).
 * @param {number} period - The number of periods for the moving average (e.g., 20).
 * @returns {Promise<number|null>} - The moving average or null if insufficient data.
 */
const getMovingAverage = async (coin, period = 20) => {
  // Validate that 'period' is a positive integer
  if (!Number.isInteger(period) || period <= 0) {
    throw new Error("Period must be a positive integer");
  }

  // Embed 'LIMIT' directly into the query after validation
  const query = `
    SELECT close_price
    FROM ticker
    WHERE coin = ?
    ORDER BY received_at ASC
    LIMIT ${period}
  `;

  try {
    const rows = await execute(query, [coin]);

    if (!rows || rows.length < period) {
      // Not enough data to calculate Moving Average
      return null;
    }

    // Extract closing prices as numbers
    const closePrices = rows.map((row) => parseFloat(row.close_price));

    // Calculate Moving Average
    const sum = closePrices.reduce((acc, price) => acc + price, 0);
    const movingAverage = sum / period;

    return parseFloat(movingAverage.toFixed(2));
  } catch (error) {
    throw error;
  }
};

const getPriceRange = async (coin, interval = 15) => {
  const query = `
    SELECT MAX(best_ask_price) - MIN(best_ask_price) AS price_range
    FROM ticker
    WHERE coin = ?
      AND received_at >= NOW() - INTERVAL ? MINUTE
  `;

  const rows = await execute(query, [coin, interval]);

  return rows[0].price_range || null;
};

/**
 * Executes a SQL query with parameters.
 * @param {string} query - The SQL query to execute.
 * @param {Array} params - The parameters for the SQL query.
 * @returns {Promise<Array>} - The result rows.
 */

// Fetch Volatility Alerts (e.g., when ATR crosses a certain threshold)
const getVolatilityAlerts = async (coin) => {
  const query = `
    SELECT AVG(greatest_diff) AS atr_14
    FROM (
        SELECT GREATEST(
                 high_price_today - low_price_today,
                 ABS(high_price_today - LAG(close_price, 1) OVER (ORDER BY received_at)),
                 ABS(low_price_today - LAG(close_price, 1) OVER (ORDER BY received_at))
               ) AS greatest_diff
        FROM ticker
        WHERE coin = ?
          AND received_at >= NOW() - INTERVAL 14 MINUTE
    ) AS subquery
    HAVING atr_14 > 100; -- Threshold for alert
  `;

  const rows = await execute(query, [coin]);
  return rows.length > 0
    ? { alert: true, atr_14: rows[0].atr_14 }
    : { alert: false };
};

// Get Volatility Heatmap Data for Multiple Cryptocurrencies
const getVolatilityHeatmap = async () => {
  const query = `
    SELECT coin, STDDEV(best_ask_price) AS volatility
    FROM ticker
    WHERE received_at >= NOW() - INTERVAL 5 MINUTE
    GROUP BY coin
  `;

  const rows = await execute(query);
  return rows;
};

const getRealTimePriceRange = async (coin) => {
  const query = `
    SELECT MAX(best_ask_price) - MIN(best_ask_price) AS price_range,
           MAX(best_ask_price) AS max_price, 
           MIN(best_ask_price) AS min_price
    FROM ticker
    WHERE coin = ?
    AND received_at >= NOW() - INTERVAL 3 SECOND;
  `;

  const rows = await execute(query, [coin]);
  return rows.length > 0
    ? rows[0]
    : { price_range: 0, max_price: 0, min_price: 0 };
};

module.exports = {
  execute,
  getAverageClosePrice,
  getTotalVolume,
  getRecentTickerData,
  getBollingerBands,
  getMovingAverage, // Exported for future use
  getPriceRange,
  getVolatilityAlerts,
  getVolatilityHeatmap,
  getRealTimePriceRange,
};
