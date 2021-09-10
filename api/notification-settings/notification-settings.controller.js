/*
 * Module dependencies.
 */
const _ = require('lodash'),
  express = require('express'),
  mongoose = require('mongoose'),
  NotificationSettings = mongoose.model('NotificationSettings'),
  User = mongoose.model('User'),
  config = require('../../config'),
  actions = require('./actions.constants'),
  errorHandler = require('../core/errors.controller');


  exports.listAll = async (req, res) => {
    try {
      const result = await NotificationSettings.find({ user: req.currentUser._id }).lean();
      return res.jsonp(result);
    } catch (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  };

  exports.listActionsWithServices = async (req, res) => {
    try {
      return res.jsonp(actions.actionsObj);
    } catch (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  };

  exports.changeSettings = async (req, res) => {
    try {
      const { data } = req.body;
      await Promise.all(data.map( async (elem) => {
        await NotificationSettings.update({ organization: elem.organization, user: req.currentUser._id }, { ...elem, user: req.currentUser._id }, { upsert: true }).lean();
      }));
      return res.sendStatus(201);
    } catch (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  };

  exports.listNotificationsConfigurations = async (req, res) => {
    const serviceId = req.params.serviceId;
    const serviceActions = actions.notificationConfig[Object.keys(actions.notificationConfig).filter(k => k === serviceId)];

    try {
      return res.jsonp(serviceActions);
    } catch (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  };

  exports.disableBanner = async (req, res) => {
    const userId = req.currentUser._id;
    await User.findByIdAndUpdate(userId, { pushNotificationsBannerDisabled: true });
    try {
      return res.sendStatus(201);
    } catch (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  };

  exports.updateNotificationsConfigurations = async (req, res) => {
    const organizationId = req.headers['organization-id'];
    const serviceId = req.params.serviceId;
    const { push, email } = req.body;
    try {
      const notificationSettings = await NotificationSettings.findOne({ organization: organizationId, user: req.currentUser._id }).lean();
      const newEmailService = {
        serviceId,
        enabled: email.enabled,
        actions: email.actions
      };
      const newPushService = {
        serviceId,
        enabled: push.enabled,
        actions: push.actions
      };
      const newEmail = {
        enabled: email.enabled,
        services: [newEmailService]
      };
      const newPush = {
        enabled: push.enabled,
        services: [newPushService]
      };
      if (!notificationSettings) {
        const newSettings = {
          organization: organizationId,
          user: req.currentUser._id,
          push: newPush,
          email: newEmail
        };
        const result = await NotificationSettings.create(newSettings);
        return res.jsonp(result);
      } else {
        const newSettings = {
          organization: organizationId,
          user: req.currentUser._id,
          push: {},
          email: {}
        };
        if (!notificationSettings.push) {
          notificationSettings.push = newPush;
        } else {
          const existingPush = notificationSettings.push.services.find(s => s.serviceId === serviceId);
          if (existingPush) {
            notificationSettings.push.services = notificationSettings.push.services.map((s => {
              if (s.serviceId === serviceId) {
                return newPushService;
              }
              return s;
            }))
          } else {
            notificationSettings.push.services.push(newPushService);
          }
          newSettings.push = notificationSettings.push;
        }

        if (!notificationSettings.email) {
          notificationSettings.email = newEmail;
        } else {
          const existingEmail = notificationSettings.email.services.find(s => s.serviceId === serviceId);
          if (existingEmail) {
            notificationSettings.email.services = notificationSettings.email.services.map((s => {
              if (s.serviceId === serviceId) {
                return newEmailService;
              }
              return s;
            }))
          } else {
            notificationSettings.email.services.push(newEmailService);
          }
          newSettings.email = notificationSettings.email;
        }

        const result = await NotificationSettings.findByIdAndUpdate(notificationSettings._id, newSettings, { new: true }).lean();
        return res.jsonp(result);
      }
    } catch (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  };
