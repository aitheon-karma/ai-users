/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

/**
 * Settings
 */
const NewsSchema = new Schema({
  title: String,
  show: Boolean,
  htmlContent: String
}, {
  timestamps: true,
  collection: 'fedoralabs__news'
});


module.exports = mongoose.model('News', NewsSchema);
