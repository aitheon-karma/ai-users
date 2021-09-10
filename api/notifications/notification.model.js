/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const NotificationSchema = new Schema({
  /**
   * Visible Title
   */
  title: {
    type: String,
    required: true
  },
  /**
   * User
   */
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  /**
   * Type like, organization invite or etc
   */
  actionType: String,
  /**
   * Data that will need action
   */
  actionData: Object,
  /**
   * Read or not notification
   */
  actionResult: String,
  /**
   * Read or not notification
   */
  read: {
    type: Boolean,
    default: false
  },
},{
  timestamps: true
});

module.exports = mongoose.model('Notification', NotificationSchema);
