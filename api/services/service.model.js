/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

/**
 * Micro services
 */
const ServiceSchema = new Schema({
  /**
   * Short key to be used for access detection and etc.
   */
  _id: {
    type: String,
    required: true
  },

  // Image for the service

  image: {
    type: String
  },
  /**
   * Name of micro service
   */
  name: {
    type: String,
    required: true
  },
  /**
   * Helpful description of service
   */
  description: {
    type: String,
  },
  /**
   * Helpful url to service
   */
  url: String,
  /**
   * Icon class for css
   */
  iconClass: String,
  /**
   * Each service may depend on a list of dependencies
   */
  dependencies: [{
    type: String,
    ref: 'Service'
  }],
  /**
   * Type of service. Where it can be used
   */
  serviceType: {
    type: String,
    enum: ['personal', 'organization', 'any'],
    default: 'personal'
  },
  /**
   * Is service private and not see in general list
   */
  private: {
    type: Boolean,
    default: false
  },
  envStatus: {
    type: String,
    default: 'ALPHA',
    enum: [
      'ALPHA',
      'BETA',
      'PROD'
    ]
  },
  /**
   * Core service, Can't be disabled by user
   */
  core: {
    type: Boolean,
    default: false
  },
  /**
   * Show service at main navigation
   */
  showAtMenu: {
    type: Boolean,
    default: true
  },
  gitUrl: String,
  k8sNamespace: String
},{
  timestamps: true
});

module.exports = mongoose.model('Service', ServiceSchema);
