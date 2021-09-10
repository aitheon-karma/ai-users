/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * UserWallet
 */
const PaymentSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User',
  },
  amount: {
    usd: Number,
    coin: Number,
    received: Number,
  },
  sentCurrency: String,
  externalId: {
    unique: true,
    type: String,
  },
  status: {
    default: 'PENDING',
    type: String,
    enum: [
      'PENDING',
      'PAID', // Paid by user need to process
      'TOKENS_TRANSFERED',
      'TIMEOUT', // timeout
      'ERROR', // Error on one of process step
      'DONE' // Processed
    ]
  },
  extra: {
    address: String,
    confirmsNeeded: Number,
    confirmsReceived: Number,
    status_url: String,
    qrcode_url: String,
    timeout: Number,
    dest_tag: String,
    externalStatus: Number
  },
  tokens: {
    amount: Number,
    transferredAt: Date,
    transactionHash: String
  },
  transferLock: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'users__payments'
});


module.exports = mongoose.model('Payment', PaymentSchema);
