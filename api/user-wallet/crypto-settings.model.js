/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Crypto  Price
 */
const CryptoSettingsSchema = new Schema({
  BTC: {
    ETH: Number,
    USD: Number,
    EUR: Number,
  },
  ETH: {
    BTC: Number,
    USD: Number,
    EUR: Number,
  },
  LTC: {
    BTC: Number,
    USD: Number,
    EUR: Number,
  },
  AITHEON_TOKEN: {
    USD: {
      type: Number,
      default: 0
    }
  },
  tokenSaleAddress: String
}, {
    timestamps: true,
    collection: 'fedoralabs__crypto_settings'
  });


module.exports = mongoose.model('CryptoSettings', CryptoSettingsSchema);
