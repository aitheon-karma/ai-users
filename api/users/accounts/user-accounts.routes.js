/**
 * Module dependencies.
 */
const userAccounts = require('./user-accounts.controller'),
      policy = require('../../core/policy.controller');

module.exports = (app) => {

  app.route('/api/users/accounts')
    .get(policy.processUser, userAccounts.list);

  app.route('/api/users/accounts/:accountType')
    .get(policy.processUser, userAccounts.read)
    .post(policy.processUser, userAccounts.save);

  app.route('/api/users/accounts/UPWORK/token')
    .post(policy.processUser, policy.orgAdminIsAllowed, userAccounts.createUpworkToken);
    
  app.route('/api/users/accounts/:accountType/all')
    .get(policy.interLocalAllowed, userAccounts.listAll);

  app.route('/api/upwork-done')
    .get(userAccounts.upworkDone);

  app.route('/api/users/accounts/UPWORK/roles')
    .get(policy.processUser, policy.processOrganization, policy.orgAdminIsAllowed, userAccounts.upworkRoles)
    .post(policy.processUser, policy.processOrganization, policy.orgAdminIsAllowed, userAccounts.saveUpworkRoles);

  app.route('/api/users/twitter')
    .delete(policy.processUser, userAccounts.unlinkTwitter)
    .get(policy.processUser, userAccounts.joinTwitter);
}
