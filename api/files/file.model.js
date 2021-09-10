/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const FileSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  fileStoreKey: String,
  size: Number,
  contentType: String,
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization'
  }
},{
  timestamps: true,
  collection: 'organizations__files'
});

module.exports = mongoose.model('File', FileSchema);
