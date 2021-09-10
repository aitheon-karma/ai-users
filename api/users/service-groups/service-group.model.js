/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const UserServiceGroupSchema = new Schema({
  name: String,
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization'
  },
  services: [{
    type: String,
    ref: 'Service'
  }]
},{
  timestamps: true,
  collection: 'users__service_groups'
});

module.exports = mongoose.model('UserServiceGroup', UserServiceGroupSchema);
