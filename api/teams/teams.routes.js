/**
 * Module dependencies.
 */
const teams = require('./teams.controller');
const policy = require('../core/policy.controller');

module.exports = (app) => {
  app.route('/api/organizations/:organizationId/teams')
    .get(policy.processUser, policy.orgAdminIsAllowed, teams.list)
    .post(policy.processUser, policy.orgAdminIsAllowed, teams.create);

  app.route('/api/organizations/:organizationId/teams/:teamId')
    .put(policy.processUser, policy.orgAdminIsAllowed, teams.update)
    .delete(policy.processUser, policy.orgAdminIsAllowed, teams.delete);

  app.route('/api/organizations/:organizationId/teams/search')
    .get(policy.processUser, teams.searchTeam);

  app.route('/api/organizations/:organizationId/teams/members/search')
    .get(policy.processUser, teams.searchTeamMembers);

  app.param('teamId', teams.teamByID);
};
