
const mongoose = require('mongoose');

const { Schema } = mongoose;

const UserTypeSchema = new Schema({

  _id: {
    required: true,
    type: String
  },
  displayText: {
    type: String,
    required: true
  },
  image: String,
  isActive: {
    type: Boolean,
    default: true
  },
  widgets: [String],
  description: String,
}, {
    timestamps: true,
  });

module.exports = mongoose.model('UserType', UserTypeSchema, 'users__types');
