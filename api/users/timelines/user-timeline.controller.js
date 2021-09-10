/**
 * Module dependencies.
 */
const _ = require('lodash'),
    path = require('path'),
    mongoose = require('mongoose'),
    UserFeed = mongoose.model('UserFeed'),
    User = mongoose.model('User'),
    errorHandler = require(path.resolve('./api/core/errors.controller'));

exports.timelines = (req, res) => {
    let query = { user: req.user._id, viewType: User.getViewTypeString(req.params.viewType), timeline: true };
    UserFeed.find(query).sort({ createdAt: -1 }).then((timelines) => {
        res.json({ timelines: timelines });
    }).catch((err) => {
        res.status(422).send({
            message: errorHandler.getErrorMessage(err)
        });
    });
};