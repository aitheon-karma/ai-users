/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

/**
 * DashboardSettings
 */
const DashboardSettings = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization'
  },
  initDone: {
    type: Boolean,
    default: false
  },
  skipWelcomeVideo: {
    type: Boolean,
    default: false
  },
  isFirstCreated: Boolean,
  hideServiceMap: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'users__dashboard_settings'
});


module.exports = mongoose.model('DashboardSettings', DashboardSettings);
