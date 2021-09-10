/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const BugReportSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  userAgent: String,
  ip: String,
  url: String,
  status: {
    default: 'SUBMITTED',
    type: String,
    enum: [
      'SUBMITTED',
      'ACCEPTED',
      'IN_PROGRESS',
      'DUBLICATE',
      'NOT_BUG',
      'RESOLVED'
    ]
  }
},{
  collection: 'fedoralabs__bug_reports',
  timestamps: true
});

module.exports = mongoose.model('BugReport', BugReportSchema);
