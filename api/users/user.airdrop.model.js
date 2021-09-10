/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const UserAirdropSchema = new Schema({
    user: { type: Schema.ObjectId, ref: 'User' },
    checkDate: Date,
    groupJoined: Boolean,
    nameMatched: Boolean
}, {
    timestamps: true,
    collection: 'users__airdrops',
});

module.exports = mongoose.model('UserAirdrop', UserAirdropSchema);
