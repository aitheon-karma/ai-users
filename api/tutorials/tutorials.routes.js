/**
 * Module dependencies.
 */
const tutorialSettings = require('./tutorials.controller');
const policy = require('../core/policy.controller');

module.exports = (app) => {
  app.route('/api/admin/tutorials/settigs')
    .get(policy.processUser, tutorialSettings.listSettings)
    .put(policy.processUser, policy.orgAdminIsAllowed, tutorialSettings.update)

  app.route('/api/admin/tutorials/media')
    .post(policy.processUser, tutorialSettings.createMedia)

};
