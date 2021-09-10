/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

/**
 * Settings
 */
const SettingsSchema = new Schema({
  dashboard: {
    showWelcome: Boolean,
    welcomeHtml: String
  }
}, {
  timestamps: true,
  collection: 'fedoralabs__settings'
});


module.exports = mongoose.model('Settings', SettingsSchema);
