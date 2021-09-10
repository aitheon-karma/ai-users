// https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR
/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * UserWallet
 */
const UserWalletSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User',
    unique: true,
    index: true
  },
  ethWalletAddress: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  bitcoinWalletAddress: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  litecoinWalletAddress: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  tokens: {
    type: Number,
    default: 0
  },
  presaleCredit: [],
  airdropTokens: {
    type: Number,
    default: 0
  },
  airdropStatus: String
}, {
  timestamps: true,
  collection: 'users__wallet'
});


module.exports = mongoose.model('UserWallet', UserWalletSchema);
