/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
  Schema = mongoose.Schema;

const OrganizationInviteSchema = new Schema({
  /**
   * Organization reference
   */
  organization: {
    type: Schema.ObjectId,
    ref: 'Organization',
    required: true
  },
  /**
   * Reference to existing user it exist
   */
  user: {
    type: Schema.ObjectId,
    ref: 'User'
  },
  /**
   * When it's new user we will use this info to 
   */
  newUserInfo: {
    _id: Schema.ObjectId,
    email: String,
    profile: {
      firstName: String,
      lastName: String
    },
    salt: String,
    password: String
  },
  isEmployee: {
    type: Boolean,
    default: false
  },

  /**
   * Role in this organization
   */
  inviteAccess: {
    role: {
      type: String,
      enum: ['Owner', 'SuperAdmin', 'OrgAdmin', 'User'],
      default: 'User'
    },
    teams: [{
      type: Schema.ObjectId,
      ref: 'Team'
    }],
    services: [{
      service: {
        type: String,
        ref: 'Service',
      },
      role: {
        type: String,
        enum: ['ServiceAdmin', 'User'],
        default: 'User'
      }
    }]
  },
  createdBy: {
    type: Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OrganizationInvite', OrganizationInviteSchema);
