/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

/**
 * FAQ
 */
const FAQSchema = new Schema({
  question: String,
  answer: String,
  slug: String,
  orderIndex: Number,
}, {
  timestamps: true,
  collection: 'fedoralabs__faqs'
});


module.exports = mongoose.model('FAQ', FAQSchema);
