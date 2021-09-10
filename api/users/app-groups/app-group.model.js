const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

const UserAppGroupSchema = new Schema({
  name: String,
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization'
  },
  applications: [{
    type: Schema.ObjectId,
    ref: 'Graph.graphNodes'
  }]
}, {
  timestamps: true,
  collection: 'users__app_groups'
});

module.exports = mongoose.model('UserAppGroup', UserAppGroupSchema);
