
/**
 * Module dependencies.
 */
const userWallet = require('./user-wallet.controller'),
      cryptoSettings = require('./crypto-settings.controller'),
      express = require('express'),
      policy = require('../core/policy.controller');

/**
 * Init module routes
 * @param {Express} app Express js application object
 */
module.exports = (app) => {
  const apiRoutes = express.Router();

  apiRoutes.route('/me')
        .get(policy.processUser, userWallet.myWallet);

  apiRoutes.route('/me')
        .post(policy.processUser, userWallet.saveWallet);

  // Inject API routes to app
  app.use('/api/user-wallet', apiRoutes);

}

