const WebSocket = require("ws");
const OpenAI = require("openai");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Ensure this environment variable is set
});

// Function to dynamically import node-fetch
async function fetchDynamic(url, options) {
  const fetch = (await import("node-fetch")).default;
  return fetch(url, options);
}

// Function to query OpenAI for categorization and response
async function queryOpenAI(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            'You are a financial assistant specializing in cryptocurrency data analysis. Your task is to categorize user queries into one of three categories and provide an appropriate response:\n\n1. **Real-Time Data** - For queries requesting current market prices or volumes.\n   Example Query: "What is the current price of bitcoin?"\n\n2. **Historical Data** - For queries about past performance or trends over time.\n   Example Query: "How is BTC performing from past 24hrs?"\n\n3. **Generic Data** - For general inquiries or opinions not directly tied to specific market data.\n   Example Query: "Do you think I can be in profits if I buy BTC/USD now?"\n\nGiven the query, determine its category and provide a structured response based on the available data.',
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error querying OpenAI:", error);
    throw error;
  }
}

// Function to handle user queries
async function handleQuery(query) {
  const pair = getHardcodedPair(query);

  if (!pair) {
    return "Unable to determine a valid cryptocurrency pair from the user query.";
  }

  try {
    const categoryPrompt = `Query: "${query}"`;
    const category = await queryOpenAI(categoryPrompt);

    if (category.includes("Real-Time")) {
      const realTimeData = await fetchRealTimeData(pair);
      return `Real-Time Data:\nPrice: ${realTimeData.price}\nVolume: ${realTimeData.volume}`;
    } else if (category.includes("Historical")) {
      const historicalData = await fetchHistoricalData(pair);
      return `Historical Data:\nOpen: ${historicalData.open}\nHigh: ${historicalData.high}\nLow: ${historicalData.low}\nClose: ${historicalData.close}\nVolume: ${historicalData.volume}\nTrades: ${historicalData.trades}`;
    } else {
      return await generateLLMResponse(query);
    }
  } catch (error) {
    console.error(`Error handling query: ${error.message}`);
    return `Error handling query: ${error.message}`;
  }
}

// Fetch real-time data via WebSocket API
function fetchRealTimeData(pair) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket("wss://ws.kraken.com/");
    ws.on("open", () => {
      ws.send(
        JSON.stringify({
          event: "subscribe",
          pair: [pair],
          subscription: { name: "ticker" },
        })
      );
    });
    ws.on("message", (data) => {
      const message = JSON.parse(data);
      if (message[1] && message[1]["c"]) {
        resolve({ price: message[1]["c"][0], volume: message[1]["v"][1] });
        ws.close();
      }
    });
    ws.on("error", (error) => reject(`WebSocket error: ${error}`));
    setTimeout(() => reject("WebSocket timeout"), 10000);
  });
}

// Fetch historical data from Kraken API
async function fetchHistoricalData(pair) {
  try {
    const response = await fetchDynamic(
      `https://api.kraken.com/0/public/OHLC?pair=${pair}&interval=1440&count=1`
    );
    const data = await response.json();
    if (data.error.length === 0 && data.result && data.result[pair]) {
      const [timestamp, open, high, low, close, volume, trades] =
        data.result[pair][0];
      return { open, high, low, close, volume, trades };
    } else {
      throw new Error("Historical data not found.");
    }
  } catch (error) {
    throw new Error(`Error fetching historical data: ${error.message}`);
  }
}

// Generate LLM response for generic queries
async function generateLLMResponse(query) {
  const prompt = `Answer the following query:\n"${query}"`;
  return await queryOpenAI(prompt);
}

// Helper function to get hardcoded pairs
function getHardcodedPair(query) {
  const pairs = {
    bitcoin: "BTC/USD",
    BTC: "BTC/USD",
    ethereum: "ETH/USD",
    litecoin: "LTC/USD",
    ripple: "XRP/USD",
  };
  for (const key in pairs)
    if (query.toLowerCase().includes(key)) return pairs[key];
  return "";
}

module.exports = { handleQuery };
