/**
 * Module dependencies.
 */
const notifications = require('./notifications.controller'),
      policy = require('../core/policy.controller');

module.exports = (app) => {
  
  app.route('/api/notifications')
    .post(policy.processUser, policy.serviceAllowed('HR', 'ServiceAdmin'), notifications.create)
    .get(policy.processUser, notifications.list);

  app.route('/api/notifications/:notificationId')
    .put(policy.processUser, notifications.markAsRead);

  app.param('notificationId', notifications.notificationByID);

}
