const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const UserFeedCommentSchema = new Schema({
    feed: {
        type: Schema.ObjectId,
        ref: 'UserFeed'
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    content: {
        type: String,
        maxlength: 512
    }
}, {
    timestamps: true,
    collection: 'users_feed_comments'
});

module.exports = mongoose.model('UserFeedComment', UserFeedCommentSchema);