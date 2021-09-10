/**
 * Module dependencies.
 */
const bugReports = require('./bug-reports.controller'),
      policy = require('../core/policy.controller');

module.exports = (app) => {
  
  app.route('/api/bug-reports').post(policy.processUser, bugReports.create);

}
