/*
 * Module dependencies.
 */
const _ = require('lodash');
const mongoose = require('mongoose');
const path = require('path');
const Activity = mongoose.model('UserActivity');
const errorHandler = require(path.resolve('./api/core/errors.controller'));


/*
 * List activities
 */
exports.list = async (req, res) => {
  try {
    const { startDate, endDate, type, user } = req.query;
    const query = {};
    if (type) {
      query.type = type;
    }
    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.createdAt = {
        $gte: start,
        $lt: end
      };
    }

    if (user) {
      query.user = user;
    }

    const result = await Activity.find(query).populate('createdBy', '_id profile');
    return res.jsonp(result);
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err),
      status: 'ERROR'
    });
  }

};

/*
 * Create activity
 */
exports.create = async (req, res) => {
  try {
    const result = await Activity.create(req.body);
    res.jsonp({ message: 'Activity added', status: 'SUCCESS', data: result });
  } catch (err) {
    return res.status(422).send({
      message: errorHandler.getErrorMessage(err),
      status: 'ERROR'
    });
  }

};
