/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

const LogSchema = new Schema({
  /**
   * Service Id
   */
	service: {
		type: String,
		default: '',
		trim: true
	},
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization'
  },
  message: {
		type: String,
		default: '',
		trim: true
	},
	type: {
		type: String,
		enum: [
			'ERROR',
      'WARN',
			'INFO',
			'AUDIT_TRAIL',
      'UNDEFINED'
		],
		default: 'UNDEFINED'
	},
  parseType: String,
  data: {
    /*  related data to the ParseType. 
    *   Push variables/objects onto this object. 
    *   Parse will be different for every micro service and will have a log parser if needed.
    */
  }

},{
  timestamps: true,
  collection: 'fedoralabs__logs'
});

module.exports = mongoose.model('Log', LogSchema);