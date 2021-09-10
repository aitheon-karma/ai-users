const _ = require('lodash'),
    mongoose = require('mongoose'),
    UserFeedComment = mongoose.model('UserFeedComment'),
    UserFeed = mongoose.model('UserFeed'),
    User = mongoose.model('User'),
    path = require('path'),
    errorHandler = require(path.resolve('./api/core/errors.controller'));

    exports.getCommentsByFeed = (req, res) => {
        let feedId = req.params.feedId;

        UserFeedComment.find({ feed: feedId }).sort({ createdAt: -1 }).populate('user', 'profile').then((comments) => {
            res.json(comments);
        }).catch((err) => {
            res.status(422).send({
                message: errorHandler.getErrorMessage(err)
            });
        });
    };

    exports.getCommentsByPublicFeed = (req, res) => {
        let feedId = req.params.feedId;
        let viewType = User.getViewTypeString(1);
        let query = {
            _id: feedId,
            viewType: viewType,
            isArchived: false,
            viewPermission: 'ALL'
        };
        UserFeed.find(query).then((feed) => {
            if (feed[0]._id) {
                UserFeedComment.find({ feed: feed[0]._id }).sort({ createdAt: -1 }).populate('user', 'profile').then((comments) => {
                    res.json(comments);
                }).catch((err) => {
                    res.status(422).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                });
            } else {
                res.json({});
            }
        }).catch((err) => {
            res.status(422).send({
                message: errorHandler.getErrorMessage(err)
            });
        });
    };

    exports.getCommentsByUser = (req, res) => {
        let userId = req.params.userId;

        UserFeedComment.find({ user: userId }).sort({ createdAt: -1 }).populate('user', 'profile').then((comments) => {
            res.json(comments);
        }).catch((err) => {
            res.stats(422).send({
                message: errorHandler.getErrorMessage(err)
            });
        });
    };

    exports.addComment = (req, res) => {
        let newComment = new UserFeedComment({
            feed: req.params.feedId,
            user: req.currentUser._id,
            content: req.body.content
        });

        newComment.save((err, comment) => {
            if (err) return res.status(422).send({
                message: errorHandler.getErrorMessage(err)
            });

            return res.json(comment);
        });
    };

    exports.updateComment = (req, res) => {
        UserFeedComment.findOneAndUpdate({ _id: req.params.commentId }, { content: req.body.content })
            .exec((err, comment) => {
                if (err) {
                    return res.status(422).send({
                        message: errorHandler.getErrorMessage(err)
                    });
                }
                comment.content = req.body.content;

                return res.json(comment);

        });
    };

    // not secure, need to refactor
    // can use ---- user: { _id: req.currentUser._id }
    // but then would not be able to delete author of the feed
    // need to implement check if user is author of the feed or author of the comment

    exports.deleteComment = (req, res) => {
        UserFeedComment.findOneAndDelete({ _id: req.params.commentId }).exec((err, comment) => {
            if (err) {
                return res.status(422).send({
                    message: errorHandler.getErrorMessage(err)
                });
            }
            if (!comment) {
                return res.status(422).send({
                    message: "Comment not found or you don't have authorization to delete"
                });
            }
            return res.json({});
        });
    };