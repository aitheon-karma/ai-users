/*
 * Module dependencies.
 */
const _ = require('lodash'),
      express = require('express'),
      mongoose = require('mongoose'),
      Service = mongoose.model('Service'),
      User = mongoose.model('User'),
      Team = mongoose.model('Team'),
      Organization = mongoose.model('Organization'),
      errorHandler = require('../core/errors.controller');

/*
 * Organizations Services
 */
exports.list = (req, res) => {
  Service.find({ $or:[{ serviceType: 'organization' }, { serviceType: 'any' }] }, '-gitUrl -k8sNamespace').exec((err, services) => {
    if (err) {
      return res.status(400).send({
        message: err
      });
    } else {
      services = services.filter((s) => { return envAccessChecker(s, req.currentUser.envAccess) })
      res.jsonp(services);
    }
  });
};

const envAccessChecker = (service, userEnv) => {
  if (!service){
    return false;
  }

  let access;
  switch (userEnv) {
    case 'ALPHA':
      access = service.envStatus === 'PROD'  || service.envStatus === 'BETA' || service.envStatus === 'ALPHA';
      break;
    case 'BETA':
      access = service.envStatus === 'PROD'  || service.envStatus === 'BETA';
      break;
    case 'PROD':
      access = service.envStatus === 'PROD';
      break;
  }
  return access;
}

/*
 * Services list allowed for personal usage
 */
exports.listPersonal = (req, res) => {
  Service.find({ $or:[{ serviceType: 'personal' }, { serviceType: 'any' }] }, '-gitUrl -k8sNamespace').exec((err, services) => {
    if (err) {
      return res.status(400).send({
        message: err
      });
    } else {
      if(req.currentUser) {
        services = services.filter((s) => { return envAccessChecker(s, req.currentUser.envAccess); } )
      }
      res.jsonp(services);
    }
  });
};

/**
 * Show the current service
 */
exports.read = function (req, res) {
  // convert mongoose document to JSON
  var service = req.service ? req.service.toJSON() : {};

  // Add a custom field to the Article, for determining if the current User is the "owner".
  // NOTE: This field is NOT persisted to the database, since it doesn't exist in the Article model.
  // service.isCurrentUserOwner = !!(req.user && article.user && article.user._id.toString() === req.user._id.toString());

  res.json(service);
};

/*
 * Create new
 */
exports.create = (req, res) => {
  let service = new Service(req.body);
  service.save((err, service) => {
    if (err) {
      return res.status(422).send({
        message: err
      });
    } else {
      res.jsonp(service);
    }
  });
};


/*
 * Update service
 */
exports.update = (req, res) => {
  let service = req.service;

  service = _.extend(service, req.body);

  service.save((err, service) => {
    if (err) {
      return res.status(422).send({
        message: err
      });
    } else {
      res.jsonp(service);
    }
  });
};

/**
 * service middleware
 */
exports.serviceByID = (req, res, next, id) => {

  Service.findById(id).exec((err, service) => {
      if (err) {
        return next(err);
      } else if (!service) {
        return res.status(404).send({
          message: 'No service with that identifier has been found'
        });
      }
      req.service = service;
      next();
    });
};


/**
 * List of service that is enabled for this user OR in This Organization if query param specified
 */
exports.userServices = (req, res) => {

  let organizationId = req.query.organizationId;
  let selectFields = 'name url description dependencies iconClass envStatus serviceType showAtMenu core';

  let services = req.currentUser.services;
  if (organizationId){
    let role = req.currentUser.roles.find((r) => { return r.organization._id === organizationId; });
    if (!role){
      return res.json([]);
    }
    services = role.services.map((s) => { return s.service; });
  }

  Service.find({ _id: { $in: services } }, selectFields).exec((err, services) => {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    res.json(services);
  });

};
