// src/services/websocketService.js

const WebSocket = require('ws');
const tickerModel = require('../models/tickerModel');
const logger = require('../utils/logger');

/**
 * Connects to Kraken's WebSocket API, subscribes to multiple pairs, and handles incoming data.
 */
const connectToKrakenWebSocket = () => {
  const ws = new WebSocket('wss://ws.kraken.com');

  ws.on('open', () => {
    logger.info('Connected to Kraken WebSocket');

    const supportedCoins = process.env.SUPPORTED_COINS.split(','); // e.g., ['BTC/USD', 'SOL/USD']

    const subscribeMessage = {
      event: 'subscribe',
      pair: supportedCoins,
      subscription: {
        name: 'ticker',
      },
    };

    ws.send(JSON.stringify(subscribeMessage));
    logger.info(`Subscribed to pairs: ${supportedCoins.join(', ')}`);
  });

  ws.on('message', async (data) => {
    try {
      const parsedData = JSON.parse(data);

      // Handle subscription status messages
      if (parsedData.event) {
        if (
          parsedData.event === 'subscriptionStatus' &&
          parsedData.status === 'subscribed'
        ) {
          logger.info(`Subscription successful for pair: ${parsedData.pair}`);
        }
        return;
      }

      // Handle ticker data
      if (Array.isArray(parsedData) && parsedData.length >= 4) {
        const tickerInfo = parsedData[1];
        const channelName = parsedData[2];
        const pair = parsedData[3]; // e.g., 'BTC/USD'

        // Extract the coin symbol from the pair
        const [coin, fiat] = pair.split('/');

        const record = {
          coin: coin, // e.g., 'BTC'
          pair: pair,
          channel_name: channelName,
          best_ask_price: parseFloat(tickerInfo.a[0]),
          best_ask_whole_lot_volume: parseInt(tickerInfo.a[1], 10),
          best_ask_lot_volume: parseFloat(tickerInfo.a[2]),
          best_bid_price: parseFloat(tickerInfo.b[0]),
          best_bid_whole_lot_volume: parseInt(tickerInfo.b[1], 10),
          best_bid_lot_volume: parseFloat(tickerInfo.b[2]),
          close_price: parseFloat(tickerInfo.c[0]),
          close_lot_volume: parseFloat(tickerInfo.c[1]),
          volume_today: parseFloat(tickerInfo.v[0]),
          volume_last_24h: parseFloat(tickerInfo.v[1]),
          vwap_today: parseFloat(tickerInfo.p[0]),
          vwap_last_24h: parseFloat(tickerInfo.p[1]),
          number_of_trades_today: parseInt(tickerInfo.t[0], 10),
          number_of_trades_last_24h: parseInt(tickerInfo.t[1], 10),
          low_price_today: parseFloat(tickerInfo.l[0]),
          low_price_last_24h: parseFloat(tickerInfo.l[1]),
          high_price_today: parseFloat(tickerInfo.h[0]),
          high_price_last_24h: parseFloat(tickerInfo.h[1]),
          open_price_today: parseFloat(tickerInfo.o[0]),
          open_price_last_24h: parseFloat(tickerInfo.o[1]),
        };

        // Insert the record into Singlestore
        try {
          await tickerModel.insertTickerRecord(record);
          // logger.info(`Inserted ${record.coin} ticker data into Singlestore`);
        } catch (dbError) {
          logger.error(`Error inserting ${record.coin} data into Singlestore:`, dbError);
        }
      }
    } catch (error) {
      logger.error('Error parsing WebSocket message:', error);
    }
  });

  ws.on('error', (error) => {
    logger.error('WebSocket error:', error);
  });

  ws.on('close', () => {
    logger.warn('Kraken WebSocket connection closed. Reconnecting in 5 seconds...');
    setTimeout(connectToKrakenWebSocket, 5000); // Reconnect after 5 seconds
  });
};

module.exports = connectToKrakenWebSocket;
// export default connectToKrakenWebSocket;
