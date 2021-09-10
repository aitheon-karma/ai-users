/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      actions = require('./actions.constants'),
      Schema = mongoose.Schema;

const NotificationTypeSettingsSchema = new Schema({
  enabled: {
    type: Boolean,
    default: false
  },
  services: [{
    serviceId: String,
    enabled: {
      type: Boolean,
      default: false
    },
    actions: [
      {
        type: String,
        enum: actions.getAllActionsEnum()
      }
    ]
  }]
});

/**
 * Notification Settings Schema
 */
const NotificationSettingsSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization'
  },
  email: NotificationTypeSettingsSchema,
  push: NotificationTypeSettingsSchema
}, {
  timestamps: true,
  collection: 'users__notification_settings'
});


module.exports = mongoose.model('NotificationSettings', NotificationSettingsSchema);
