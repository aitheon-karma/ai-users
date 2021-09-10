const appGroups = require('./app-groups.controller');
const policy    = require('../../core/policy.controller');

module.exports = (app) => {
  app.route('/api/app-groups')
    .get(policy.processUser, appGroups.list)
    .post(policy.processUser, appGroups.save);
};
