
const mongoose = require('mongoose');
const config = require('../../../config');

const { Schema } = mongoose;

const QuestionTypes = {
  SINGLE_IMAGE: 'SINGLE_IMAGE',
  MULTIPLE_IMAGE: 'MULTIPLE_IMAGE'
}

const QuestionSchema = new Schema({
  questionText: {
    type: String,
    required: true,
    maxlength: config.validators.MAX_DESCRIPTION_LENGTH
  },
  target : {
    type: String,
    enum: ['USER', 'ORGANIZATION'],
    default: 'ORGANIZATION'
  },
  userType: {
    type: String,
    ref: 'UserTypes'
  },
  imageUrl: String,
  questionType: {
    required: true,
    type: String,
    enum: Object.keys(QuestionTypes)
  },
  options: [{
    optionText: {
      type: String,
      maxlength: config.validators.MAX_DESCRIPTION_LENGTH
    },
    imageUrl: String,
    tooltip: {
      type: String,
      maxlength: config.validators.MAX_DESCRIPTION_LENGTH
    },
    enabledServices: [{
      service: {
        type: String,
        ref: 'Service'
      },
      config: String
    }]
  }],
  number: {
    type: Number,
    required: true,
    min: 0
  },
  parentOption: {
    type: Schema.ObjectId
  },
  service: String
}, {
  timestamps: true,
});

module.exports = mongoose.model('Question', QuestionSchema, 'users__questions');
