/*
 * Module dependencies.
 */
const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const ServiceGroup = mongoose.model('UserServiceGroup');
const errorHandler = require(path.resolve('./api/core/errors.controller'));

/*
 * Service Group list by user or organization Id
 */
exports.list = (req, res) => {
  const organization = req.headers['organization-id'];
  const query = { user: req.currentUser._id };
  if (organization) {
    query.organization = organization;
  } else {
    query.organization = { $eq: null };
  }
  ServiceGroup.find(query).populate('services').exec((err, serviceGroups) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    res.jsonp(serviceGroups);
  });
};

/**
 * Service Group middleware
 */
exports.serviceGroupById = (req, res, next, id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'service group is invalid',
    });
  }

  ServiceGroup.findById(id).exec((err, serviceGroup) => {
    if (err) {
      return next(err);
    } if (!serviceGroup) {
      return res.status(404).send({
        message: 'No service group with that identifier has been found',
      });
    }
    req.serviceGroup = serviceGroup;
    next();
  });
};

/*
 * Create Service Group
 */
exports.create = (req, res) => {
  const organization = req.headers['organization-id'];
  const serviceGroup = new ServiceGroup(req.body);
  serviceGroup.user = req.currentUser._id;
  if (organization) {
    serviceGroup.organization = organization;
  }
  serviceGroup.save(serviceGroup, (err, serviceGroup) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
        status: 'ERROR'
      });
    }
    res.jsonp(serviceGroup);
  });
};

/*
 * Update Service Group
 */
exports.update = (req, res) => {
  let { serviceGroup } = req;

  serviceGroup = _.extend(serviceGroup, req.body);

  serviceGroup.save((err, serviceGroup) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    res.jsonp(serviceGroup);
  });
};

/*
 * Delete Service Group
*/
exports.delete = (req, res) => {
  const { serviceGroup } = req;
  serviceGroup.remove((err, serviceGroup) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err),
      });
    }
    res.jsonp(serviceGroup);
  });
};
