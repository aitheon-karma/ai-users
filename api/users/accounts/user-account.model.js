/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const UserAccountSchema = new Schema({
  type: {
    type: String,
    enum: ['NEST', 'UPWORK']
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization'
  },
  credentials: {}
},{
  timestamps: true,
  collection: 'users_accounts',
  strict: false
});

module.exports = mongoose.model('UserAccount', UserAccountSchema);
