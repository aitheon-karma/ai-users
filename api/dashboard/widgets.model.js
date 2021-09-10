/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Widget
 */
const WidgetSchema = new Schema({
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization'
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  component: String,
  config: {
    cols: Number,
    rows: Number,
    y: Number,
    x: Number,
    dragEnabled: Boolean,
    resizeEnabled: Boolean
  }
}, {
    timestamps: true,
    collection: 'users__widgets'
  });


module.exports = mongoose.model('Widget', WidgetSchema);
