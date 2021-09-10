/**
 * Module dependencies.
 */
const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const UserFeedSchema = new Schema({
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    isArticle: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        maxlength: 150
    },
    content: {
        type: String,
        validate: [postLimit, '{PATH} have length more than really needed']
    },
    imageUrl: {
        type: String,
        maxlength: 512
    },
    likes: [{
        type: Schema.ObjectId,
        ref: 'User'
    }],
    shares: [{
        type: Schema.ObjectId,
        ref: 'User'
    }],
    views: {
        type: Number,
        default: 0
    },
    isShared: {
        type: Schema.ObjectId,
        ref: 'UserFeed'
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    isPinned: {
        type: Boolean,
        default: false
    },
    attachment: {
        url: {
            type: String,
            maxlength: 512
        },
        contentType: String
    },
    urlContents: {
        title: {
            type: String,
            maxlength: 512
        },
        description: {
            type: String,
            maxlength: 512
        },
        imageUrl: {
            type: String,
            maxlength: 512
        },
        url: {
            type: String,
            maxlength: 512
        }
    },
    viewType: {
        type: String,
        enum: [
            'PERSONAL',
            'PROFESSIONAL'
        ],
        default: 'PERSONAL'
    }, 
    viewPermission: {
        type: String,
        enum: [
            'ALL',
            'FRIENDS',
            'ME'
        ],
        default: 'ALL'
    }
}, {
    timestamps: true,
    collection: 'users_feeds'
});

UserFeedSchema.statics.getPermissionTypeString = function(viewPermission) {
    const availableViewPermissions = [
      'ALL',
      'FRIENDS',
      'ME'
    ];
    if (!viewPermission || isNaN(viewPermission)
        || parseInt(viewPermission) < 1 
        || parseInt(viewPermission) > availableViewPermissions.length) {
      return availableViewPermissions[0];
    }
    return availableViewPermissions[parseInt(viewPermission) - 1];
  }

function postLimit(val) {
    let l = val.length;
    if (this.isArticle) {
        return l < 20000;
    } else {
        return l < 1000;
    }
}

module.exports = mongoose.model('UserFeed', UserFeedSchema);
