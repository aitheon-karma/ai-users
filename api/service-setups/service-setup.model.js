/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

/**
 * Service Setup
 */
const ServiceSetupSchema = new Schema({
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization'
  },
  service: String,
  unconfigured: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'service__setups'
});


module.exports = mongoose.model('ServiceSetup', ServiceSetupSchema);
