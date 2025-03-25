const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const connectToKrakenWebSocket = require("./services/websocketService");
const analyticsRoutes = require("./routes/analyticsRoutes");
const singlestoreService = require("./services/singlestoreService");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const { ethers } = require("ethers");
const axios = require("axios");

require("dotenv").config();
const { handleQuery } = require("./services/groqService");

const app = express();
const port = process.env.PORT || 5000;
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow all origins
    methods: ["GET", "POST"],
  },
});
app.use(express.json());

const PORT = process.env.SERVER_PORT || 4000;
const ANALYTICS_INTERVAL = process.env.ANALYTICS_INTERVAL || 1000; // Allow customization via ENV

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/analytics", analyticsRoutes);

app.post("/query", async (req, res) => {
  try {
    const userQuery = req.body.query;
    const response = await handleQuery(userQuery);
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
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
      try {
        const averagePrice = await singlestoreService.getAverageClosePrice(
          coin
        );
        const totalVolume = await singlestoreService.getTotalVolume(coin);
        const bollingerBands = await singlestoreService.getBollingerBands(
          coin,
          20,
          2
        );
        const movingAverage = await singlestoreService.getMovingAverage(
          coin,
          20
        );
        const averageTrueRange = await singlestoreService.getAverageTrueRange(
          coin
        );

        return {
          coin,
          analytics: {
            average_close_price: averagePrice || null,
            total_volume: totalVolume || null,
            bollinger_bands: bollingerBands || null,
            moving_average: movingAverage || null,
            average_true_range: averageTrueRange || null,
          },
        };
      } catch (analyticsError) {
        logger.error(
          `Error calculating analytics for ${coin}:`,
          analyticsError
        );
        return null; // Return null if there’s an error for a particular coin
      }
    });

    const analyticsDataArray = (await Promise.all(analyticsPromises)).filter(
      (data) => data !== null
    ); // Filter out null results

    // Emit analytics data to all connected clients
    analyticsDataArray.forEach((data) => {
      io.emit("analyticsUpdate", data);
      // logger.info(`Emitted analytics for ${data.coin}`);
    });
  } catch (error) {
    logger.error("Error emitting analytics:", error);
  }
};
// Validate Environment Variables
if (!process.env.SEPOLIA_API_URL) {
  console.error("Error: SEPOLIA_API_URL is not defined in the .env file.");
  process.exit(1);
}

if (!process.env.PRIVATE_KEY) {
  console.error("Error: PRIVATE_KEY is not defined in the .env file.");
  process.exit(1);
}

// Smart Contract Details
const PURCHASE_SIMULATOR_ADDRESS = "0xFc60AB5e93b917395CBBb88AA5F14Ba60C50eB25"; // Replace with your deployed PurchaseSimulator contract address

// Minimal ABI to interact with PurchaseSimulator's buy function and PurchaseMade event
const PURCHASE_SIMULATOR_ABI = [
  "function buy(uint256 amount) external payable",
  "event PurchaseMade(address indexed buyer, uint256 amount)",
];

// Initialize Ethers Provider and Signer
const provider = new ethers.providers.JsonRpcProvider(
  process.env.SEPOLIA_API_URL
);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const purchaseSimulator = new ethers.Contract(
  PURCHASE_SIMULATOR_ADDRESS,
  PURCHASE_SIMULATOR_ABI,
  wallet
);

// In-memory user balances (for simulation purposes)
// Note: In production, use a persistent database
const userBalances = {};
setInterval(async () => {
  try {
    console.log("Fetching new prediction...");

    const predictionResponse = await axios.post(
      "http://146.190.123.50:5000/prediction",
      {
        pair: "ETH/USD", // You can adjust this or make it dynamic based on users
      }
    );

    const { processed_vectors, decision } = predictionResponse.data;

    // Store the latest prediction data globally
    latestPrediction = {
      processed_vectors,
      decision,
      timestamp: new Date(), // Keep a timestamp to know when it was fetched
    };

    const accuracy =
      (processed_vectors.reduce((a, b) => a + b, 0) /
        processed_vectors.length) *
      100;

    console.log(`Accuracy: ${accuracy}, Decision: ${decision}`);

    if (accuracy > 60) {
      try {
        const address = "0xcB85555a244000761D25be3b498FeC29B59a1F9B";

        // Validate Ethereum Address
        if (!address || !ethers.utils.isAddress(address)) {
          console.error("Invalid Ethereum address.");
          return;
        }
        // Define the amount to simulate buying (e.g., 0.001 ETH)
        const ethToSend = ethers.utils.parseEther("0.001"); // 0.001 ETH

        // Define the amount parameter (could be set to 0.01 for balance adjustment)
        const amountToBuy = 1; // Define how much 'fake ETH' is bought per 0.001 ETH

        // Call buy function, sending 0.001 ETH
        const tx = await purchaseSimulator.buy(amountToBuy, {
          value: ethToSend,
        });

        console.log(`Transaction submitted: ${tx.hash}`);

        // Wait for transaction to be mined
        const receipt = await tx.wait();

        console.log(`Transaction mined in block ${receipt.blockNumber}`);

        // Update user's balance
        if (!userBalances[address]) {
          userBalances[address] = 0;
        }

        // On buying, increase balance by 0.01 MockETH
        userBalances[address] += 0.01;

        // Fetch Sepolia ETH balance
        const sepoliaBalanceWei = await provider.getBalance(address);
        const sepoliaBalance = ethers.utils.formatEther(sepoliaBalanceWei);

        // Respond with ethBought, newMockBalance, and sepoliaETHBalance
        // res.status(200).json({
        //   ethBought: "0.001 ETH",
        //   newMockBalance: userBalances[address].toFixed(2) + " MockETH",
        //   sepoliaETHBalance: sepoliaBalance + " ETH",
        // });
      } catch (error) {
        console.error("Error in /api/simulate-purchase:", error);
      }
    }

    console.log(
      `Updated Prediction: ${decision}, Vectors: ${processed_vectors}`
    );
  } catch (error) {
    console.error("Error fetching prediction:", error);
  }
}, 10000);
// API Endpoint to Simulate Purchase
app.post("/api/simulate-purchase", async (req, res) => {
  console.log("called");
  try {
    const { address } = req.body;

    // Validate Ethereum Address
    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: "Invalid Ethereum address." });
    }
    // Define the amount to simulate buying (e.g., 0.001 ETH)
    const ethToSend = ethers.utils.parseEther("0.001"); // 0.001 ETH

    // Define the amount parameter (could be set to 0.01 for balance adjustment)
    const amountToBuy = 1; // Define how much 'fake ETH' is bought per 0.001 ETH

    // Call buy function, sending 0.001 ETH
    const tx = await purchaseSimulator.buy(amountToBuy, { value: ethToSend });

    console.log(`Transaction submitted: ${tx.hash}`);

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    console.log(`Transaction mined in block ${receipt.blockNumber}`);

    // Update user's balance
    if (!userBalances[address]) {
      userBalances[address] = 0;
    }

    // On buying, increase balance by 0.01 MockETH
    userBalances[address] += 0.01;

    // Fetch Sepolia ETH balance
    const sepoliaBalanceWei = await provider.getBalance(address);
    const sepoliaBalance = ethers.utils.formatEther(sepoliaBalanceWei);

    // Respond with ethBought, newMockBalance, and sepoliaETHBalance
    res.status(200).json({
      ethBought: "0.001 ETH",
      newMockBalance: userBalances[address].toFixed(2) + " MockETH",
      sepoliaETHBalance: sepoliaBalance + " ETH",
    });
  } catch (error) {
    console.error("Error in /api/simulate-purchase:", error);
    res
      .status(500)
      .json({ error: "An error occurred while processing your purchase." });
  }
});

// API Endpoint to Fetch Sepolia ETH Balance
app.post("/api/get-sepolia-balance", async (req, res) => {
  try {
    const { address } = req.body;

    // Validate Ethereum Address
    if (!address || !ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: "Invalid Ethereum address." });
    }

    // Fetch Sepolia ETH balance
    const sepoliaBalanceWei = await provider.getBalance(address);
    const sepoliaBalance = ethers.utils.formatEther(sepoliaBalanceWei);

    res.status(200).json({
      sepoliaETHBalance: sepoliaBalance + " ETH",
    });
  } catch (error) {
    console.error("Error in /api/get-sepolia-balance:", error);
    res.status(500).json({
      error: "An error occurred while fetching the Sepolia ETH balance.",
    });
  }
});
/**
 * Function to emit stats (like best ask, bid, max volume, etc.)
 */
const emitStats = async () => {
  try {
    const stats = await singlestoreService.getCoinStats();

    // Emit stats to all connected clients
    io.emit("statsUpdate", stats);
    // logger.info("Emitted stats update");
  } catch (error) {
    logger.error("Error emitting stats:", error);
  }
};

// Start emitting analytics every X seconds
setInterval(emitAnalytics, ANALYTICS_INTERVAL);

// Emit stats every X seconds (same interval or different depending on the needs)
setInterval(emitStats, ANALYTICS_INTERVAL);

// Initial invocation to emit data immediately upon server start
emitAnalytics();
emitStats();

// Start Kraken WebSocket connection
connectToKrakenWebSocket();

// Start the server
server.listen(PORT, () => {
  logger.info(`Backend server is running on port ${PORT}`);
});
