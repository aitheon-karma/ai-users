/**
 * Module dependencies.
 */
const pushSubscriptions = require('./push-subscriptions.controller'),
      express = require('express'),
      policy = require('../core/policy.controller');

/**
 * Init module routes
 * @param {Express} app Express js application object
 */
module.exports = (app) => {
  const apiRoutes = express.Router();

  apiRoutes.route('/')
        .get(policy.processUser, pushSubscriptions.listSubscriptions)
        .post(policy.processUser, pushSubscriptions.addSubscription);

  apiRoutes.route('/notify')
        .post(pushSubscriptions.sendPushNotifications);


  // Inject API routes to app
  app.use('/api/push-subscriptions', apiRoutes);

}
