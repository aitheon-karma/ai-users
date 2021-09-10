/**
 * Module dependencies.
 */
const services = require('./services.controller'),
      policy = require('../core/policy.controller');

module.exports = (app) => {

  app.route('/api/services')
    .get(policy.processUser, services.list)
    .post(policy.processUser, policy.sysadminOnly, services.create);


  /*
  Removed authorization because we need this list before signup.
  app.route('/api/services/personal')
    .get(policy.processUser, services.listPersonal);
  */
  app.route('/api/services/personal')
     .get(services.listPersonal);


  app.route('/api/services/:serviceId')
    .get(services.read)
    .put(policy.processUser, policy.platformRoleOnly, services.update);

  app.route('/api/me/services')
    .get(policy.processUser, services.userServices);

  app.param('serviceId', services.serviceByID);

}
