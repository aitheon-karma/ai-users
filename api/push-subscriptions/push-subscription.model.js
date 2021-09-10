/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

/**
 * Push Notifications Schema
 */
const PushSubscriptionSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  subscriptions: {
    type: [{
      endpoint: String,
      expirationTime: Number,
      keys: {
        p256dh: String,
        auth: String
      },
      userAgent: String
    }],
    default: []
  }
}, {
  timestamps: true,
  collection: 'users__push_subscriptions'
});


module.exports = mongoose.model('PushSubscription', PushSubscriptionSchema);
