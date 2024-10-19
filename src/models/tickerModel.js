// src/models/tickerModel.js

const singlestoreService = require('../services/singlestoreService');

/**
 * Inserts a new ticker record into Singlestore.
 * @param {Object} record - The ticker data to insert.
 */
const insertTickerRecord = async (record) => {
  const insertQuery = `
    INSERT INTO ticker (
      coin, pair, channel_name,
      best_ask_price, best_ask_whole_lot_volume, best_ask_lot_volume,
      best_bid_price, best_bid_whole_lot_volume, best_bid_lot_volume,
      close_price, close_lot_volume,
      volume_today, volume_last_24h,
      vwap_today, vwap_last_24h,
      number_of_trades_today, number_of_trades_last_24h,
      low_price_today, low_price_last_24h,
      high_price_today, high_price_last_24h,
      open_price_today, open_price_last_24h
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    record.coin,
    record.pair,
    record.channel_name,
    record.best_ask_price,
    record.best_ask_whole_lot_volume,
    record.best_ask_lot_volume,
    record.best_bid_price,
    record.best_bid_whole_lot_volume,
    record.best_bid_lot_volume,
    record.close_price,
    record.close_lot_volume,
    record.volume_today,
    record.volume_last_24h,
    record.vwap_today,
    record.vwap_last_24h,
    record.number_of_trades_today,
    record.number_of_trades_last_24h,
    record.low_price_today,
    record.low_price_last_24h,
    record.high_price_today,
    record.high_price_last_24h,
    record.open_price_today,
    record.open_price_last_24h,
  ];

  return singlestoreService.execute(insertQuery, values);
};

module.exports = {
  insertTickerRecord,
};
