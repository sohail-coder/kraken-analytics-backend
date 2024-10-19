// src/utils/logger.js

const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: 'info', // Set to 'debug' for more verbose output
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'kraken-analytics-backend' },
  transports: [
    new transports.Console(),
    // You can add File transports or other transports here
  ],
});

module.exports = logger;
