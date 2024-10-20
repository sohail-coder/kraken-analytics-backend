// // src/server.js

// const express = require("express");
// const http = require("http");
// const socketIo = require("socket.io");
// const cors = require("cors");
// const connectToKrakenWebSocket = require("./services/websocketService");
// const analyticsRoutes = require("./routes/analyticsRoutes");
// const singlestoreService = require("./services/singlestoreService");
// const logger = require("./utils/logger");
// const errorHandler = require("./middleware/errorHandler");
// require("dotenv").config();

// const app = express();
// const server = http.createServer(app);
// const io = socketIo(server, {
//   cors: {
//     origin: "http://localhost:3000", // Frontend URL
//     methods: ["GET", "POST"],
//   },
// });

// const PORT = process.env.SERVER_PORT || 4000;

// // Middleware
// app.use(cors());
// app.use(express.json());

// // API Routes
// app.use("/api/analytics", analyticsRoutes);

// // Error Handling Middleware
// app.use(errorHandler);

// // Socket.IO Connections
// io.on("connection", (socket) => {
//   logger.info(`Client connected: ${socket.id}`);

//   socket.on("disconnect", () => {
//     logger.info(`Client disconnected: ${socket.id}`);
//   });
// });

// /**
//  * Function to emit analytics periodically
//  */
// const emitAnalytics = async () => {
//   try {
//     // Fetch distinct coins from the ticker table
//     const coinsRows = await singlestoreService.execute(`
//   SELECT DISTINCT coin FROM ticker
// `);

//     const coins = coinsRows.map((row) => row.coin);

//     if (coins.length === 0) {
//       logger.info("No coins found in the ticker table.");
//       return;
//     }

//     // Prepare analytics data for each coin
//     const analyticsPromises = coins.map(async (coin) => {
//       const averagePrice = await singlestoreService.getAverageClosePrice(coin);
//       const totalVolume = await singlestoreService.getTotalVolume(coin);
//       return {
//         coin,
//         average_close_price: averagePrice,
//         total_volume: totalVolume,
//       };
//     });

//     const analyticsDataArray = await Promise.all(analyticsPromises);

//     // Emit analytics data to all connected clients
//     analyticsDataArray.forEach((data) => {
//       io.emit("analyticsUpdate", data);
//       logger.info(`Emitted analytics for ${data.coin}`);
//     });
//   } catch (error) {
//     logger.error("Error emitting analytics:", error);
//   }
// };

// // Start emitting analytics every 10 seconds
// setInterval(emitAnalytics, 10000);

// // Start Kraken WebSocket connection
// connectToKrakenWebSocket();

// // Start the server
// server.listen(PORT, () => {
//   logger.info(`Backend server is running on port ${PORT}`);
// });
// src/server.js

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const connectToKrakenWebSocket = require("./services/websocketService");
const analyticsRoutes = require("./routes/analyticsRoutes");
const singlestoreService = require("./services/singlestoreService");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
require("dotenv").config();
const groqService = require("./services/groqService");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Frontend URL
    methods: ["GET", "POST"],
  },
});

const PORT = process.env.SERVER_PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/analytics", analyticsRoutes);

app.post("/query", async (req, res) => {
  const query = req.body.query;

  if (!query) {
    return res.status(400).json({ error: "Query not provided" });
  }

  try {
    // Call handleQuery and wait for the result
    const result = await groqService.handleQuery(query);

    // Respond with the result
    res
      .status(200)
      .json({ message: "Query processed successfully", data: result });
  } catch (error) {
    console.error("Error processing query:", error);
    res.status(500).json({ error: "Error processing query" });
  }
});

// Error Handling Middleware
app.use(errorHandler);

// Socket.IO Connections
io.on("connection", (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on("disconnect", () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

/**
 * Function to emit analytics periodically
 */
const emitAnalytics = async () => {
  try {
    // Fetch distinct coins from the ticker table
    const coinsRows = await singlestoreService.execute(`
      SELECT DISTINCT coin FROM ticker
    `);

    // Ensure coinsRows is an array
    if (!Array.isArray(coinsRows)) {
      throw new TypeError("coinsRows is not an array");
    }

    const coins = coinsRows.map((row) => row.coin);

    if (coins.length === 0) {
      logger.info("No coins found in the ticker table.");
      return;
    }

    // Prepare analytics data for each coin
    const analyticsPromises = coins.map(async (coin) => {
      const averagePrice = await singlestoreService.getAverageClosePrice(coin);
      const totalVolume = await singlestoreService.getTotalVolume(coin);
      const bollingerBands = await singlestoreService.getBollingerBands(
        coin,
        20,
        2
      ); // period=20, stdDev=2
      const movingAverage = await singlestoreService.getMovingAverage(coin, 20); // period=20
      const averageTrueRange = await singlestoreService.getAverageTrueRange(
        coin
      );
      return {
        coin,
        analytics: {
          average_close_price: averagePrice,
          total_volume: totalVolume,
          bollinger_bands: bollingerBands,
          moving_average: movingAverage,
          averageTrueRange: averageTrueRange,
          // Added moving average
          // Future analytics techniques can be added here, e.g.,
          // relative_strength_index: { ... },
          // moving_averages: { ... },
        },
      };
    });

    const analyticsDataArray = await Promise.all(analyticsPromises);

    // Emit analytics data to all connected clients
    analyticsDataArray.forEach((data) => {
      io.emit("analyticsUpdate", data);
      logger.info(`Emitted analytics for ${data.coin}`);
    });
  } catch (error) {
    logger.error("Error emitting analytics:", error);
  }
};

// Start emitting analytics every 10 seconds
setInterval(emitAnalytics, 10000);

// Initial invocation to emit data immediately upon server start
emitAnalytics();

// Start Kraken WebSocket connection
connectToKrakenWebSocket();

// Start the server
server.listen(PORT, () => {
  logger.info(`Backend server is running on port ${PORT}`);
});
