/**
 * Module dependencies.
 */
const media = require('./media.controller'),
      express = require('express'),
      policy = require('../core/policy.controller');

/**
 * Init module routes
 * @param {Express} app Express js application object
 */
module.exports = (app) => {
  const apiRoutes = express.Router();

  apiRoutes.route('/:mediaId')
        .get(policy.processUser, media.getStream);

  // Inject API routes to app
  app.use('/api/media', apiRoutes);

}
