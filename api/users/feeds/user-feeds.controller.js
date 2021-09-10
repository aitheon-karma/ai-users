/**
 * Module dependencies.
 */
const _ = require('lodash'),
    express = require('express'),
    mongoose = require('mongoose'),
    UserFeed = mongoose.model('UserFeed'),
    User = mongoose.model('User'),
    UserFeedComment = mongoose.model('UserFeedComment'),
    path = require('path'),
    config = require(path.resolve('./config')),
    timelineHandler = require(path.resolve('./api/users/timelines/user-timeline.controller')),
    errorHandler = require(path.resolve('./api/core/errors.controller')),
    metascraper = require('metascraper')([
        require('metascraper-author')(),
        require('metascraper-date')(),
        require('metascraper-description')(),
        require('metascraper-image')(),
        require('metascraper-logo')(),
        require('metascraper-clearbit-logo')(),
        require('metascraper-publisher')(),
        require('metascraper-title')(),
        require('metascraper-url')()
    ]),
    got = require('got'),
    moment = require('moment'),
    externalRequest = require('request-promise-native'),
    policy = require('../../core/policy.controller'),
    pageSize = 10;

/*
 * User feeds list
 */
exports.feeds = (req, res) => {
    let viewType = User.getViewTypeString(req.params.viewType);
    let postType = req.params.postType;
    let query = {
        user: req.user._id,
        viewType: viewType,
        isArchived: false
    };
    if (postType === 'original') {
        query.isShared = { $exists: false };
    } 
    
    if (postType === 'archived' && viewType === 'PROFESSIONAL') {
        query.isShared = { $exists: false };
        query.isArchived = true;
    }
    
    let pageNo = req.params.pageNo;
    if (!pageNo || pageNo <= 0) {
        pageNo = 1;
    }
    UserFeed.find(query).sort({ isPinned: -1, createdAt: -1, }).skip((pageNo - 1) * pageSize)
            .limit(pageSize).populate({ path : 'isShared', populate : { path : 'user'}})
            .populate('user', 'profile.firstName profile.lastName profile.avatarUrl').then((feeds) => {
        res.json({ feeds: feeds, pageNo: pageNo, pageSize: pageSize });
    }).catch((err) => {
        res.status(422).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};

exports.publicFeeds = (req, res) => {
    let viewType = User.getViewTypeString(1);
    let query = {
        user: req.params.userId,
        viewType: viewType,
        isArchived: false,
        viewPermission: 'ALL'
    };
    let pageNo = req.params.pageNo;
    if (!pageNo || pageNo <= 0) {
        pageNo = 1;
    }
    UserFeed.find(query).sort({ isPinned: -1, createdAt: -1, }).skip((pageNo - 1) * pageSize)
            .limit(pageSize).populate({ path : 'isShared', populate : { path : 'user'}})
            .populate('user', 'profile.firstName profile.lastName profile.avatarUrl').then((feeds) => {
        res.json({ feeds: feeds, pageNo: pageNo, pageSize: pageSize });
    }).catch((err) => {
        res.status(422).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};


exports.publicFeedById = (req, res) => {
    let viewType = User.getViewTypeString(1);
    let query = {
        _id: req.params.feedId,
        viewType: viewType,
        isArchived: false,
        viewPermission: 'ALL'
    };
    UserFeed.find(query)
            .populate({ path : 'isShared', populate : { path : 'user'}})
            .populate('user', 'profile.firstName profile.lastName profile.avatarUrl').then((feed) => {
        res.json(feed);
    }).catch((err) => {
        res.status(422).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};

/*
 * Connection feeds list
 */
exports.getConnectionFeeds = (req, res) => {
    const toDay = moment();
    const lastDay = moment().subtract(7, 'days');
    let query = { user: req.params.connectionId };
    let date = { createdAt:{ $gte: lastDay, $lt: toDay} };
    UserFeed.find({
        $and : [ query, date ]
    }).sort({ createdAt: -1 }).populate('user').then((feeds) => {
        res.json({ feeds: feeds });
    }).catch((err) => {
        res.status(422).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};


/**
 * Create a new feed item
 */
exports.addFeed = (req, res) => {
    req.body.user = req.currentUser._id; // setting logged in user as feed owner
    let feedItem;
    if (req.params.viewType == 1) {
        feedItem = new UserFeed(_.pick(req.body, 'content', 'user', 'imageUrl', 'urlContents'));
    }
    if (req.params.viewType == 2) {
        feedItem = new UserFeed(_.pick(req.body, 'title', 'content', 'user', 'imageUrl', 'urlContents'));
        feedItem.isArticle = true;
    }
    feedItem.viewType = User.getViewTypeString(req.params.viewType);
    feedItem.viewPermission = UserFeed.getPermissionTypeString(req.body.viewPermission);
    feedItem.save((err, feed) => {
        if (err) {
            return res.status(422).send({
                message: errorHandler.getErrorMessage(err)
            });
        }

        // CREATE A DRIVE FOR THIS FEEDS'S IMAGE
        const token = policy.getTokenFromRequest(req);
        const url = `${config.driveURI}/api/acl`;
        const options = {
            url: url,
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
                'Authorization': `JWT ${token}`
            },
            json: true,
            body: {
                'level': 'FULL',
                'user': req.currentUser._id,
                'service': {
                    '_id': 'USERS',
                    'key': feed._id,
                    'keyName': ''
                },
                'public': true
            }
        };
        externalRequest(options, function (error, response, body) {
            return res.json(feed);
        });
 
    });
};

exports.addShare = (req, res) => {
    UserFeed.findById(req.params.feedId).exec((err, feed) => {
        if (err) return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
        });
        let newShare;
        if (feed.isShared) {
            newShare = new UserFeed({
                user: req.currentUser._id,
                isShared: feed.isShared,
                viewType: feed.viewType
            });
        } else {
            newShare = new UserFeed({
                user: req.currentUser._id,
                isShared: req.params.feedId,
                viewType: feed.viewType
            });
        }
        newShare.save((err, share) => {
            if (err) return res.status(422).send({
                message: errorHandler.getErrorMessage(err)
            });
    
            UserFeed.findOneAndUpdate({ _id: req.params.feedId }, { $push: { shares: { _id: req.currentUser._id }}}).exec((err, feed) => {
                if (err) return res.status(422).send({
                    message: errorHandler.getErrorMessage(err)
                });
                return res.json(share);
            });
        });
    });
};

/**
 * Extract metadata from url
 */
exports.extractURLData = async (req, res) => {
    const { body: html, url } = await got(req.body.targetUrl);
    const metadata = await metascraper({ html, url });
    return res.json(metadata);
};

/**
 * Delete feed item
 */
exports.deleteFeed = (req, res) => {
    UserFeed.findOneAndDelete({ _id: req.params.feedId, user: req.currentUser._id }).exec((err, feed) => {
        if (err) {
            return res.status(422).send({
                message: errorHandler.getErrorMessage(err)
            });
        }
        if (!feed) {
            return res.status(422).send({
                message: "Feed not found or you don't have authorization to delete"
            });
        } else {
            UserFeedComment.remove({ feed: req.params.feedId }, (err) => {
                if (err) {
                    return res.status(422).send({
                        message: "Feed's comments have not been deleted."
                    });
                }
            });

            UserFeed.remove({ isShared:  req.params.feedId }, (err) => {
                if (err) {
                    return res.status(422).send({
                        message: "Shares have not been deleted."
                    });
                }

                return res.json({});
            });
            
            
        }
    });
};

/**
 * Add the feed image url into the feed item
 */
exports.updateFeedAttachment = (req, res) => {
    let query = {
        _id: req.params.feedId,
        user: req.currentUser._id
    };

    UserFeed
    .findOneAndUpdate(query, { 
        attachment: {
            url: req.body.url,
            contentType: req.body.contentType
        }
    })
    .exec((err, feed) => {
        feed.attachment = {
            url: req.body.url,
            contentType: req.body.contentType
        };
        return res.json(feed);
    });
};

/**
 * Update feed item
 */
exports.updateFeed = (req, res) => {
    let findQuery = {
        _id: req.params.feedId,
        user: req.currentUser._id
    }

    let updateContents = {
    };

    if (req.body.isArticle) {
        updateContents = {
            title: req.body.title,
            content: req.body.content,
            attachment: req.body.attachment,
            shares: req.body.shares,
            isPinned: req.body.isPinned,
            urlContents: req.body.urlContents,
            isArchived: req.body.isArchived
        }
    } else {
        updateContents = {
            content: req.body.content,
            attachment: req.body.attachment,
            shares: req.body.shares,
            urlContents: req.body.urlContents
        }
    }

    
    
    UserFeed.findOneAndUpdate(findQuery, updateContents).exec((err, feed) => {
        if (req.body.isArticle) {
            feed.title = req.body.title;
            feed.content = req.body.content;
            feed.attachment = req.body.attachment;
            feed.shares = req.body.shares;
            feed.isPinned = req.body.isPinned;
            feed.urlContents = req.body.urlContents;
            feed.isArchived = req.body.isArchived;
        } else {
            feed.content = updateContents.content;
            feed.attachment = updateContents.attachment;
            feed.shared = updateContents.shared;
            feed.urlContents = updateContents.urlContents;
        }
        
        return res.json(feed);
    });
};

exports.countViews = (req, res) => {
    let feeds = req.body.feeds;
    let count = 0;
    for (let feedId of feeds) {
        UserFeed.findOneAndUpdate({ _id: feedId}, { $inc: { views: 1 }}).exec((err, feed) => {
            if (err) {
                return res.status(500).json(err);
            } else {
                count++;
                if (count === feeds.length) {
                    return res.json({});
                }
            }
        });
    }
};

exports.likeFeed = (req, res) => {
    UserFeed.findOneAndUpdate({ _id: req.params.feedId }, { $push: { likes: { _id: req.currentUser._id }}}).exec((err, feed) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.json(feed);
        }
    });
};

exports.dislikeFeed = (req, res) => {
    UserFeed.findOneAndUpdate({ _id: req.params.feedId }, { $pull: { likes: { $in: [req.currentUser._id] }}}).exec((err, feed) => {
        if (err) {
            return res.status(500).json(err);
        } else {
            return res.json(feed);
        }
    });
};