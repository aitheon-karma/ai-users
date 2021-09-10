/**
 * Module dependencies.
 */
const files = require('./files.controller'),
      policy = require('../core/policy.controller');

module.exports = (app) => {
  
  app.route('/api/organizations/:organizationId/files')
    .get(policy.processUser, policy.orgAdminIsAllowed, files.list)
    .post(policy.processUser, policy.orgAdminIsAllowed, files.create);

  app.route('/api/organizations/:organizationId/files/:fileId')
    .get(policy.processUser, policy.orgAdminIsAllowed, files.fileStream)
    .delete(policy.processUser, policy.orgAdminIsAllowed, files.delete);

  app.param('fileId', files.fileByID);

}
