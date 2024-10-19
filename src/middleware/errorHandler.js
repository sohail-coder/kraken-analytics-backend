// src/middleware/errorHandler.js

const logger = require('../utils/logger');

/**
 * Error handling middleware.
 * Sends a JSON response with the error message.
 */
const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
};

module.exports = errorHandler;
