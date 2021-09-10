/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

/**
 * Settings
 */
const MediaSchema = new Schema({
  /**
   * Key to AWS S3
   */
  storeKey: {
    type: String,
    unique: true
  },
  /**
   * Content type of uploaded file
   */
  contentType: {
    type: String
  },
   /**
   * Size of uploaded file
   */
  size: {
    type: Number
  },
  /**
   * name of uploaded file
   */
  name: {
    type: String
  },
  extension: String
}, {
  timestamps: true,
  collection: 'fedoralabs__media'
});


module.exports = mongoose.model('Media', MediaSchema);
