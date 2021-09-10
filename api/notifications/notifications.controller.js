/*
 * Module dependencies.
 */
const _ = require('lodash');
const express = require('express');
const mongoose = require('mongoose');
const Notification = mongoose.model('Notification');
const User = mongoose.model('User');
const Team = mongoose.model('Team');
const Task = mongoose.model('Task');
const errorHandler = require('../core/errors.controller');

/*
 * List notification by user
 */
exports.list = (req, res) => {
  let conditions = { user: req.currentUser._id };
  if (!req.query.all) {
    conditions.read = false;
  }
  Notification.find(conditions).exec((err, notifications) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.jsonp(notifications);
    }
  });
};

/**
 * Notification Id middleware
 */
exports.notificationByID = (req, res, next, id) => {

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).send({
      message: 'NotificationId is invalid'
    });
  }

  Notification.findById(id).exec((err, notification) => {
    if (err) {
      return next(err);
    } else if (!notification) {
      return res.status(404).send({
        message: 'No Notification with that identifier has been found'
      });
    }
    req.notification = notification;
    next();
  });
};

/**
 * Mark notification as read
 */
exports.markAsRead = (req, res) => {
  let notification = req.notification;
  notification.read = true;
  notification.save((err, notification) => {
    if (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      res.json({});
    }
  });
};

exports.create = (req, res) => {

  Team.find({ organization: req.body.organization }).exec((err, teams) => {

    const query = {
      'roles': {
        $elemMatch: {
          organization: req.body.organization,
          services: { $elemMatch: { service: req.body.service, role: req.body.serviceRole } }
        }
      }
    };
    if (teams.length > 0) {
      query.teams = {
        $in: teams.map((t) => { return t._id })
      }
    }

    User.find(query).exec((err, users) => {
      let notifications = users.map((user) => {
        let notification = new Notification({
          title: req.body.title,
          actionType: req.body.actionType,
          actionData: req.body.actionData,
          user: user
        });
        return notification;
      });
      if (notifications.length == 0) {
        return res.sendStatus(201);
      }

      Notification.insertMany(notifications, (err) => {
        if (err) {
          return res.status(422).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        res.sendStatus(201);
      })
    });
  });

}


/*
 * To create new connection request notification.
 */
exports.createConnectionRequestNotification = addConnectionRequestNotification;

/*
 * To create new connection request notification.
 */
function addConnectionRequestNotification (notificationData){
  result = {
    status :false,
    message : ''
  };

  if (notificationData === null || notificationData === undefined || notificationData === '') {
    result.message = 'Invalid input';
    return result;
  }

  if(notificationData.title === null || notificationData.title === undefined || notificationData.title === ''){
    result.message = 'Notification title is required';
    return result;
  }

  if(notificationData.user === null || notificationData.user === undefined || notificationData.user === ''){
    result.message = 'Notification user is required';
    return result;
  }


// OLD notification model, remove if no need in future
  // let notification = new Notification({
  //   title: notificationData.title,
  //   actionType: 'CONNECTIONS.REQUEST',
  //   actionData: notificationData.actionData,
  //   actionResult: notificationData.actionResult,
  //   user: notificationData.user
  // });

  let task = new Task({
    description: notificationData.title,
    assigned: [notificationData.user._id],
    action: {
      name: 'CONNECTIONS.REQUEST',
      referenceId: notificationData.actionData.connectionId,
      redirect: notificationData.actionResult
    },
    service: 'USERS',
    type: 'NOTIFICATION'
  });

  task.save((processErr, notification) => {
    if (processErr) {
      result.message = errorHandler.getErrorMessage(processErr);
      return result;
    }

    result.message = 'Notification added successfully'
    return result;
  });
}
