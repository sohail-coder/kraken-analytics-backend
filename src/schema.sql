-- setup.sql

-- Create Database
CREATE DATABASE IF NOT EXISTS kraken_data;

-- Use the Database
USE kraken_data;
DROP TABLE IF EXISTS ticker;


-- Create Ticker Table
CREATE TABLE IF NOT EXISTS ticker (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  coin VARCHAR(10) NOT NULL, -- e.g., 'BTC', 'SOL'
  pair VARCHAR(20) NOT NULL, -- e.g., 'BTC/USD'
  channel_name VARCHAR(50),
  best_ask_price DECIMAL(18,8),
  best_ask_whole_lot_volume BIGINT,
  best_ask_lot_volume DECIMAL(18,8),
  best_bid_price DECIMAL(18,8),
  best_bid_whole_lot_volume BIGINT,
  best_bid_lot_volume DECIMAL(18,8),
  close_price DECIMAL(18,8),
  close_lot_volume DECIMAL(18,8),
  volume_today DECIMAL(18,8),
  volume_last_24h DECIMAL(18,8),
  vwap_today DECIMAL(18,8),
  vwap_last_24h DECIMAL(18,8),
  number_of_trades_today INT,
  number_of_trades_last_24h INT,
  low_price_today DECIMAL(18,8),
  low_price_last_24h DECIMAL(18,8),
  high_price_today DECIMAL(18,8),
  high_price_last_24h DECIMAL(18,8),
  open_price_today DECIMAL(18,8),
  open_price_last_24h DECIMAL(18,8),
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_coin_received_at (coin, received_at) -- Composite Index
);
