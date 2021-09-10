/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

/**
 * Tutorial
 */
const TutorialSchema = new Schema({
  orderIndex: Number,
  media: {
    type: Schema.ObjectId,
    ref: 'Media'
  }
}, {
  timestamps: true,
  collection: 'fedoralabs__tutorials'
});


module.exports = mongoose.model('Tutorial', TutorialSchema);
