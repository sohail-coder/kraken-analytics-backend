const Groq = require("groq-sdk");
const WebSocket = require("ws");
const { createClient } = require("@sanity/client");
const ws = new WebSocket("wss://ws.kraken.com/");

// Set up Sanity client
const client = createClient({
  projectId: "f5w2etnc",
  dataset: "calhacks",
  apiVersion: "2021-10-21",
  token:
    "skmHOcWEdnyg7BrsKa7NBvy9DKUgafNzL7ZdS5m5NATCoQtHyUOjJk43evb6DiSvqLJXrvuki1aPFUq8BBZzOeZyo34CngTA0cHPjosiGhJee8vUKweg7788qcytO3B5MOs306icuR2bPZnfJOilHRb3jFvByoqioxttWMQJK78WGHnJ3NLP",
  useCdn: false,
});

// Set up GROQ (Replace with actual API if required)
const groq = new Groq("YOUR_GROQ_API_KEY", "YOUR_GROQ_API_SECRET");

// Function to generate a cryptocurrency pair from user input
function getHardcodedPair(query) {
  const pairs = {
    bitcoin: "BTC/USD",
    ethereum: "ETH/USD",
    litecoin: "LTC/USD",
    ripple: "XRP/USD",
  };

  for (const key in pairs) {
    if (query.toLowerCase().includes(key)) {
      return pairs[key];
    }
  }
  return ""; // Return empty if no match found
}

// Function to analyze data using GROQ (Sanity Client)
async function analyzeWithGroq(pair) {
  try {
    // Query your Sanity dataset with GROQ
    const query = `*[_type == "cryptoData" && symbol == $pair]{
      name,
      currentPrice,
      marketCap,
      volume
    }`;
    const params = { pair };
    const groqData = await client.fetch(query, params);

    if (groqData.length === 0) {
      return `No additional data found for ${pair} in Sanity dataset.`;
    }

    const { name, currentPrice, marketCap, volume } = groqData[0];
    return `Sanity Data:\nName: ${name}\nPrice: ${currentPrice}\nMarket Cap: ${marketCap}\nVolume: ${volume}`;
  } catch (error) {
    console.error("Error fetching GROQ data:", error);
    throw error;
  }
}

// Function to handle user queries
async function handleQuery(query) {
  const pair = getHardcodedPair(query);
  
  if (!pair) {
    return "Unable to generate a cryptocurrency pair from the user query.";
  }

  try {
    // Fetch real-time and historical data
    const realTimeData = await fetchRealTimeData(pair);
    const historicalData = await fetchHistoricalData(pair);
    
    // Get GROQ analysis response
    const groqResponse = await analyzeWithGroq(pair);

    // Structure and return the response as a string
    return `Query: ${query}\n\nReal-Time Data: ${JSON.stringify(realTimeData)}\n\nHistorical Data: ${JSON.stringify(historicalData)}\n\n${groqResponse}`;
  } catch (error) {
    return `Error processing query: ${error.message}`;
  }
}

// Function to fetch real-time data via WebSocket API
async function fetchRealTimeData(pair) {
  try {
    ws.on("message", (message) => {
      const data = JSON.parse(message);
      if (data && data.pair === pair) {
        console.log(`Received real-time data for ${pair}:`, data);
      }
    });
  } catch (error) {
    console.error("Error fetching real-time data:", error);
  }
}

// Function to fetch historical data via Kraken OHLC API
async function fetchHistoricalData(pair) {
  try {
    const response = await fetch(
      `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=1&since=0&count=200`
    );
    const data = await response.json();
    console.log(`Received historical data for ${pair}:`, data);
  } catch (error) {
    console.error("Error fetching historical data:", error);
  }
}

// // Function to analyze data using GROQ (Sanity Client)
// async function analyzeData() {
//   try {
//     const data = await client.fetch(`*[_type == "post"]`);
//     console.log("Fetched GROQ data: ", data);
//   } catch (error) {
//     console.error("Error fetching GROQ data:", error);
//   }
// }

// Function to handle user queries
// async function handleQuery(query) {
//   const pair = getHardcodedPair(query);
//   if (pair) {
//     fetchRealTimeData(pair);
//     fetchHistoricalData(pair);
//     analyzeData(); // Fetch additional data using GROQ
//   } else {
//     console.log(
//       "Unable to generate a cryptocurrency pair from the user query."
//     );
//   }
// }

// Start the WebSocket connection
ws.on("open", () => {
  console.log("Connected to Kraken WebSocket API");
});

module.exports = {
  handleQuery,
  // analyzeData,
  fetchHistoricalData,
  fetchRealTimeData,
  getHardcodedPair,
};
