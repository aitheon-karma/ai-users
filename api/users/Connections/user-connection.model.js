/**
 * Module dependencies.
 */

 const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const UserConnectionSchema = new Schema({
    fromUser: {
        type: Schema.ObjectId,
        ref: 'User'
    },

    /// profile access give to fromUser by toUser in toUsers profile.
    fromUserProfileAccessibility:{
        personal: Boolean,
        professional: Boolean//,
        //dating: false
    },

    toUser: {
        type: Schema.ObjectId,
        ref: 'User'
    },

    /// profile access give to toUser by fromUser in fromUsers profile.
    toUserProfileAccessibility:{
        personal: Boolean,
        professional: Boolean//,
        //dating: false
    },

    status: {
        type: String,
        enum: [
            'REQUESTED',
            'REJECTED',
            'ACCEPTED',
            'CLOSED'
          ],
        default: 'REQUESTED'
    }
},
    {
        timestamps: true,
        collection: 'users_connections'
    });

module.exports = mongoose.model('UserConnection', UserConnectionSchema);