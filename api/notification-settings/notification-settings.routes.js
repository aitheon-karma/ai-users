/**
 * Module dependencies.
 */
const notificationSettings = require('./notification-settings.controller.js'),
      express = require('express'),
      policy = require('../core/policy.controller');

/**
 * Init module routes
 * @param {Express} app Express js application object
 */
module.exports = (app) => {
  const apiRoutes = express.Router();

  apiRoutes.route('/')
        .post(policy.processUser, notificationSettings.changeSettings)
        .get(policy.processUser, notificationSettings.listAll);

  apiRoutes.route('/banner/disable')
        .get(policy.processUser, notificationSettings.disableBanner);

  apiRoutes.route('/actions/all')
        .get(policy.processUser, notificationSettings.listActionsWithServices);

  apiRoutes.route('/service-config/:serviceId')
    .get(policy.processUser, notificationSettings.listNotificationsConfigurations)
    .put(policy.processUser, notificationSettings.updateNotificationsConfigurations);


  // Inject API routes to app
  app.use('/api/notification-settings', apiRoutes);

}
