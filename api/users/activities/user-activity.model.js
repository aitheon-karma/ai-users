const mongoose = require('mongoose'),
  Schema = mongoose.Schema;


const ActivityType = {
  SIGN_UP: 'SIGN_UP',
  CHANGE_EMAIL: 'CHANGE_EMAIL'
};

const ActivitySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: Object.keys(ActivityType)
  },
  data: {
    utm: {
      campaign: String,
      medium: String,
      term: String,
      content: String,
      source: String
    },
    referral: String,
    changes: [{
      key: String,
      from: String,
      to: String
    }]
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
    timestamps: true,
    collection: 'users__activities'
  });


module.exports = mongoose.model('UserActivity', ActivitySchema);
