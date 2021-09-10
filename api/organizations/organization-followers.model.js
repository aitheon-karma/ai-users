/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const OrganizationFollowersSchema = new Schema({
    
    org: {
        type: Schema.ObjectId,
        ref: 'Organization'
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true,
    collection: 'organizations__followers'
});

module.exports = mongoose.model('OrganizationFollowers', OrganizationFollowersSchema);
