
/**
 * Module dependencies.
 */
const payments = require('./payments.controller'),
      express = require('express'),
      bodyParser = require('body-parser'),
      policy = require('../core/policy.controller');

/**
 * Init module routes
 * @param {Express} app Express js application object
 */
module.exports = (app) => {
  const apiRoutes = express.Router();

  apiRoutes.route('/transactions')
        .post(policy.processUser, payments.createTransactions);
        
  apiRoutes.route('/coinpayments')
        .post(payments.coinpaymentsEvent);

  apiRoutes.route('/rates')
        .get(policy.processUser, payments.rates);

  apiRoutes.route('/')
      .get(policy.processUser, payments.list);

  apiRoutes.route('/:id')
      .get(policy.processUser, payments.getById);
        
      //   payments/coinpayments
  // Inject API routes to app
  app.use('/api/payments', apiRoutes);

}

// https://aitheon.com/users/api/payments/coinpayments