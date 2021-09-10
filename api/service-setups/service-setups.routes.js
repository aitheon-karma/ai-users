
/**
 * Module dependencies.
 */
const serviceSetups = require('./service-setups.controller'),
      express = require('express'),
      bodyParser = require('body-parser'),
      policy = require('../core/policy.controller');

/**
 * Init module routes
 * @param {Express} app Express js application object
 */
module.exports = (app) => {
  const apiRoutes = express.Router();

  apiRoutes.route('/')
        .get(policy.processOrganization, serviceSetups.list)
        .post(serviceSetups.unconfigureService);

  apiRoutes.route('/:service')
        .delete(policy.processOrganization, serviceSetups.delete);

  // Inject API routes to app
  app.use('/api/service-setups', apiRoutes);

}
