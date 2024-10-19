// src/services/singlestoreService.js

const pool = require('../config/dbConfig');

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
 * @returns {Promise<number>} - The average close price.
 */
const getAverageClosePrice = async (coin) => {
  const query = `
    SELECT AVG(close_price) AS average_close_price
    FROM ticker
    WHERE coin = ?
      AND received_at >= NOW() - INTERVAL 24 HOUR
  `;
  const rows = await execute(query, [coin]);
  return rows[0].average_close_price;
};

/**
 * Fetches the total volume for a specific coin over the last 24 hours.
 * @param {string} coin - The cryptocurrency symbol (e.g., BTC).
 * @returns {Promise<number>} - The total volume.
 */
const getTotalVolume = async (coin) => {
  const query = `
    SELECT SUM(volume_last_24h) AS total_volume
    FROM ticker
    WHERE coin = ?
      AND received_at >= NOW() - INTERVAL 24 HOUR
  `;
  const rows = await execute(query, [coin]);
  return rows[0].total_volume;
};

/**
 * Fetches recent ticker data for a specific coin.
 * @param {string} coin - The cryptocurrency symbol (e.g., BTC).
 * @param {number} limit - Number of records to fetch.
 * @returns {Promise<Array>} - Array of ticker records.
 */
const getRecentTickerData = async (coin, limit = 100) => {
  const query = `
    SELECT *
    FROM ticker
    WHERE coin = ?
    ORDER BY received_at DESC
    LIMIT ?
  `;
  const rows = await execute(query, [coin, limit]);
  return rows;
};

// Add more service functions as needed

module.exports = {
  execute,
  getAverageClosePrice,
  getTotalVolume,
  getRecentTickerData,
};
