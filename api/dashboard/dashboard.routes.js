
/**
 * Module dependencies.
 */
const dashboard = require('./dashboard.controller'),
      express = require('express'),
      policy = require('../core/policy.controller');

/**
 * Init module routes
 * @param {Express} app Express js application object
 */
module.exports = (app) => {
  const apiRoutes = express.Router();


  apiRoutes.route('/widgets/all')
  .get(policy.processUser, dashboard.getAllWidgets)

  apiRoutes.route('/settings')
        .get(policy.processUser, dashboard.getSettings);

  apiRoutes.route('/news')
        .get(dashboard.getNews);

  apiRoutes.route('/faqs')
        .get(dashboard.getFAQ);

  apiRoutes.route('/widgets')
        .get(policy.processUser, dashboard.getWidgets)
        .post(policy.processUser, dashboard.saveWidget);

   apiRoutes.route('/tutorials')
        .get(policy.processUser, dashboard.getTutorials);

   apiRoutes.route('/organization/stats')
        .get(policy.processUser, dashboard.getOrgStats);

   apiRoutes.route('/dashboard-settings')
        .get(policy.processUser, dashboard.getDashboardSettings);

   apiRoutes.route('/dashboard-settings/:dashId')
        .put(policy.processUser, dashboard.updateDashboardSettings);

   apiRoutes.route('/widgets/:widgetId')
        .delete(policy.processUser, dashboard.removeWidget);

   apiRoutes.route('/request/feature')
        .post(policy.processUser, dashboard.requestFeature);

  // Inject API routes to app
  app.use('/api/dashboard', apiRoutes);

}
