// src/config/dbConfig.js

const mysql = require('mysql2/promise'); // Import mysql2 with Promise support
const fs = require('fs'); // File system module to read SSL certificates
const path = require('path'); // Path module to handle file paths
const logger = require('../utils/logger'); // Your custom logger using winston
require('dotenv').config(); // Load environment variables from .env file

// Define the path to the Singlestore CA bundle
const caBundlePath = path.resolve("certs/singlestore_bundle.pem");

// Verify that the CA bundle file exists
if (!fs.existsSync(caBundlePath)) {
  logger.error(`CA bundle not found at path: ${caBundlePath}`);
  process.exit(1); // Exit the application if CA bundle is missing
}

// Create a connection pool to Singlestore DB with SSL enabled
const pool = mysql.createPool({
  host: process.env.DB_HOST, // Singlestore DB host (e.g., 'localhost' or remote IP)
  port: process.env.DB_PORT || 3306, // Singlestore DB port (default is 3306)
  user: process.env.DB_USER, // Singlestore DB username
  password: process.env.DB_PASSWORD, // Singlestore DB password
  database: process.env.DB_NAME, // Database name (e.g., 'kraken_data')
  waitForConnections: true, // Wait for connections rather than throwing errors
  connectionLimit: 10, // Maximum number of connections in the pool
  queueLimit: 0, // No limit on the number of queued connection requests
  ssl: {
    ca: fs.readFileSync(caBundlePath), // Read the CA bundle for SSL
  },
});

// Test the database connection upon initialization
pool.getConnection()
  .then((connection) => {
    logger.info('✅ Connected to Singlestore DB successfully.');
    connection.release(); // Release the connection back to the pool
  })
  .catch((error) => {
    logger.error('❌ Error connecting to Singlestore DB:', error);
    process.exit(1); // Exit the application if the connection fails
  });

// Export the connection pool for use in other parts of the application
module.exports = pool;
