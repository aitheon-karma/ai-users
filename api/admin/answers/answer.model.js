
const mongoose = require('mongoose');
const config = require('../../../config');

const { Schema } = mongoose;


const AnswerSchema = new Schema({
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization'
  },
  question: {
    type: Schema.ObjectId,
    ref: 'Question'
  },
  option: {
    type: Schema.ObjectId
  },
  answered: {
    type: Boolean,
    default: true
  },
  answeredBy: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  configured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Answer', AnswerSchema, 'users__answers');
