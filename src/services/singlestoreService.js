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
 * @returns {Promise<Object>} - The statistics object.

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

// SingleStore Service

// Assuming 'execute' is your database query function
const getAverageTrueRange = async (coin, period = 20) => {
  try {
    // Validate input parameters
    if (!coin) {
      throw new Error("Coin is required and must not be undefined.");
    }

    if (!Number.isInteger(period) || period <= 0) {
      throw new Error("Period must be a positive integer.");
    }

    // Define the SQL query to calculate ATR
    const sqlQuery = `
            WITH true_range_calculation AS (
                SELECT
                    received_at,
                    high_price_today,
                    low_price_today,
                    close_price,
                    (high_price_today - low_price_today) AS range_high_low,
                    ABS(high_price_today - LAG(close_price, 1) OVER (ORDER BY received_at)) AS range_high_prev_close,
                    ABS(low_price_today - LAG(close_price, 1) OVER (ORDER BY received_at)) AS range_low_prev_close
                FROM
                    ticker
                WHERE
                    coin = ?
                    AND received_at >= NOW() - INTERVAL 4 HOUR
            ),
            true_range AS (
                SELECT
                    received_at,
                    GREATEST(range_high_low, range_high_prev_close, range_low_prev_close) AS true_range
                FROM
                    true_range_calculation
            )
            SELECT
                received_at,
                AVG(true_range) OVER (ORDER BY received_at ROWS BETWEEN ? PRECEDING AND CURRENT ROW) AS ATR -- Placeholder for the period
            FROM
                true_range;
        `;

    // Execute the query with the validated coin and period
    const results = await execute(sqlQuery, [coin, period - 1]);

    // Return the results
    return results;
  } catch (error) {
    console.error("Error calculating ATR:", error);
    throw error;
  }
};
const getCoinStats = async () => {
  const query = `
    SELECT
      (SELECT coin FROM ticker ORDER BY best_ask_price DESC LIMIT 1) AS best_ask_coin,
      (SELECT best_ask_price FROM ticker ORDER BY best_ask_price DESC LIMIT 1) AS best_ask_price,
      (SELECT coin FROM ticker ORDER BY best_bid_price DESC LIMIT 1) AS best_bid_coin,
      (SELECT best_bid_price FROM ticker ORDER BY best_bid_price DESC LIMIT 1) AS best_bid_price,
      (SELECT coin FROM ticker ORDER BY volume_today DESC LIMIT 1) AS max_volume_coin,
      (SELECT volume_today FROM ticker ORDER BY volume_today DESC LIMIT 1) AS max_volume,
      (SELECT coin FROM ticker ORDER BY close_price DESC LIMIT 1) AS max_price_coin,
      (SELECT close_price FROM ticker ORDER BY close_price DESC LIMIT 1) AS max_price,
      (SELECT coin FROM ticker ORDER BY volume_today ASC LIMIT 1) AS min_volume_coin,
      (SELECT volume_today FROM ticker ORDER BY volume_today ASC LIMIT 1) AS min_volume,
      (SELECT coin FROM ticker ORDER BY close_price ASC LIMIT 1) AS min_price_coin,
      (SELECT close_price FROM ticker ORDER BY close_price ASC LIMIT 1) AS min_price
  `;

  try {
    const rows = await execute(query);
    if (rows && rows.length > 0) {
      return rows[0]; // Return the first row containing the stats
    } else {
      return null; // Return null if no data is available
    }
  } catch (error) {
    throw error;
  }
};

const getHistoricalVolatile = async (coin) => {
  try {
    const sqlQuery = `
            WITH log_returns AS (
                SELECT
                    received_at,
                    close_price,
                    LOG(close_price / LAG(close_price, 1) OVER (ORDER BY received_at)) AS log_return
                FROM
                    ticker
                WHERE
                    coin = ?
                    AND received_at >= NOW() - INTERVAL 60 DAY
            ),
            volatility_over_time AS (
                SELECT
                    received_at,
                    STDDEV(log_return) OVER (ORDER BY received_at ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) AS historical_volatility
                FROM
                    log_returns
                WHERE
                    log_return IS NOT NULL
            )
            SELECT
                received_at,
                historical_volatility
            FROM
                volatility_over_time
            WHERE
                received_at >= NOW() - INTERVAL 30 DAY
            ORDER BY
                received_at;
        `;

    // Execute the query with the provided coin symbol (e.g., 'BTC')
    const results = await execute(sqlQuery, [coin]);

    // Return the results
    return results;
  } catch (error) {
    console.error("Error calculating historical volatility:", error);
    throw error;
  }
};

// Export the function

const getCandleData = async (coin) => {
  try {
    const query = `
            SELECT
          coin,
    DATE_FORMAT(received_at, '%Y-%m-%d %H:%i:00') AS time_interval,
    FIRST_VALUE(open_price_today) OVER (PARTITION BY pair, DATE_FORMAT(received_at, '%Y-%m-%d %H:%i') ORDER BY received_at) AS open_price,
    LAST_VALUE(best_bid_price) OVER (PARTITION BY coin, DATE_FORMAT(received_at, '%Y-%m-%d %H:%i') ORDER BY received_at RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING) AS close_price,
    MAX(high_price_today) AS high_price,
    MIN(low_price_today) AS low_price
FROM
    ticker
WHERE
    coin = ?
GROUP BY
    coin,
    time_interval
ORDER BY
    time_interval;

        `;

    // Connect to SingleStore and run the query
    const [rows] = await pool.query(query, [coin]);

    return rows; // Return the result
  } catch (error) {
    console.error("Error fetching candlestick data:", error);
    throw error; // Propagate the error
  }
};

module.exports = {
  getCoinStats,
  execute,
  getAverageClosePrice,
  getTotalVolume,
  getRecentTickerData,
  getBollingerBands,
  getMovingAverage,
  getAverageTrueRange,
  getHistoricalVolatile,
  getCandleData, // Exported for future use
};
