/**
 * Module dependencies.
 */
const serviceGroups = require('./service-groups.controller'),
  policy = require('../../core/policy.controller');

module.exports = (app) => {
  app.route('/api/service-groups')
    .get(policy.processUser, serviceGroups.list)
    .post(policy.processUser, serviceGroups.create);

  app.route('/api/service-groups/:serviceGroupId')
    .put(policy.processUser, serviceGroups.update)
    .delete(policy.processUser, serviceGroups.delete);

  app.param('serviceGroupId', serviceGroups.serviceGroupById);
};
