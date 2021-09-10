/*
 * Module dependencies.
 */
const _ = require('lodash'),
  express = require('express'),
  mongoose = require('mongoose'),
  PushSubscription = mongoose.model('PushSubscription'),
  NotificationSettings = mongoose.model('NotificationSettings'),
  config = require('../../config'),
  webpush = require('web-push'),
  Service = mongoose.model('Service'),
  errorHandler = require('../core/errors.controller'),
  logger = require('../core/logger');


  webpush.setVapidDetails('mailto:contact@aitheon.com', config.webPush.PUBLIC_VAPID, config.webPush.PRIVATE_VAPID);


  exports.listSubscriptions = async (req, res) => {
    try {
      const userId = req.currentUser._id;
      const pushSubscription = await PushSubscription.findOne({ user: userId }).lean();
      return res.jsonp(pushSubscription);
    } catch (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  };

  exports.addSubscription = async (req, res) => {
    try {
      const body = req.body;
      body.userAgent = req.headers['user-agent'];
      const userId = req.currentUser._id;

      const pushSubscription = await PushSubscription.findOne({ user: userId }).lean();
      const result = pushSubscription ? await PushSubscription.findByIdAndUpdate(pushSubscription._id, { $push: { subscriptions: body }}) :
                                        await PushSubscription.create({ user: userId, subscriptions: [body] });
      return res.sendStatus(201);
    } catch (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  };

  exports.sendPushNotifications = async (req, res) => {
    try {
      const { users, notification, organization, service, action } = req.body;
      const serviceIconUrl = await getServiceIcon(service);
      notification.icon = serviceIconUrl;
      const targets = await getTargets(users, organization, service, action);
      logger.debug('[getTargets.targets] ', targets);
      const pushSubscriptions = await PushSubscription.find({ user: { $in: targets } }).lean();
      logger.debug('[getTargets.pushSubscriptions] ', pushSubscriptions);
      await Promise.all(pushSubscriptions.map(async (pS) => {
        return await notifyUser(pS, notification);
      }));

      return res.sendStatus(201);
    } catch (err) {
      return res.status(422).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
  };

async function getTargets(targets, organization, service, action) {
  const query = {
    user: { $in: targets },
    organization,
    'push.enabled': true,
    'push.services': {
      $elemMatch: {
        serviceId: service,
        enabled: true,
        actions: action
      }
    }
  };
  const settings = await NotificationSettings.find(query).lean();
  logger.debug('[getTargets.query] ', query);
  logger.debug('[getTargets.settings] ', settings);
  return settings.map(s => s.user);
}

async function getServiceIcon(serviceId) {
  const service = await Service.findById(serviceId).lean();
  const baseUrl = config.environment == 'production' ? `${config.domain}` : `${config.domain}:${config.port}`;
  const httpTransport = config.environment == 'production' ? 'https://' : 'http://';
  // Push notifications can use only png icon format
  const imageName = service.image.replace(/\.(svg)($|\?)/, '.png$2');
  return `${httpTransport}${ baseUrl }${config.environment == 'production' ? '/users' : ''}/${imageName}`;
}

  async function notifyUser(pushSubscription, notification) {
    const notificationPayload = notification ? { notification } : {
      notification: {
        title: 'New Notification',
        body: 'This is the body of the notification',
        icon: "https://spyna.it/icons/favicon.ico",
        actions: [{ action: "Detail", title: "View", icon: "https://via.placeholder.com/128/ff0000" }]
      },
    };
    logger.debug('[notificationPayload] ', notificationPayload);
    logger.debug('[pushSubscription] ', pushSubscription);
    const pendingPromises = [];
    pushSubscription.subscriptions.forEach(subscription => {
      pendingPromises.push(
        webpush.sendNotification(
          subscription,
          JSON.stringify(notificationPayload)
        )
      );
    });

    const notValidSubscriptions = [];

    if (!Promise.allSettled) {
      Promise.allSettled = promises =>
        Promise.all(
          promises.map((promise, i) =>
            promise
              .then(value => ({
                status: "fulfilled",
                value,
              }))
              .catch(reason => ({
                status: "rejected",
                reason,
              }))
          )
        );
    }

    const results = await Promise.allSettled(pendingPromises);

    results.forEach(r => {
      if (r.status === 'rejected') notValidSubscriptions.push(r.reason.endpoint);
    });

    if (notValidSubscriptions.length) {
      const resultSubscriptions = pushSubscription.subscriptions.filter(s => !notValidSubscriptions.includes(s.endpoint));
      await PushSubscription.findByIdAndUpdate(pushSubscription._id, { subscriptions: resultSubscriptions });
    }
  }
