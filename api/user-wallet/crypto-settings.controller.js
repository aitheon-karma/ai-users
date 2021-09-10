/*
 * Module dependencies.
 */
const _ = require('lodash'),
  mongoose = require('mongoose'),
  config = require('../../config'),
  logger = require('../core/logger'),
  request = require('request'),
  CryptoSettings = mongoose.model('CryptoSettings'),
  policyController = require('../core/policy.controller'),
  errorHandler = require('../core/errors.controller');

exports.getPrice = (symbol) => {
  return new Promise((resolve, reject) => {
    CryptoSettings.findById(symbol).exec((err, result)=> {
      if (err) {
         logger.error('[CryptoSettings] Get price error', symbol, err);
         return reject(err);
      }
      resolve(result);
    })
  })
}

syncPrice = (symbol) => {
  const compareSymbols = {
    'ETH': 'BTC,USD,EUR',
    'BTC': 'USD,EUR,ETH',
    'LTC': 'BTC,USD,EUR',
  }
  request.get(`${config.cryptoPrice.apiUrl }/data/price?fsym=${symbol}&tsyms=${ compareSymbols[symbol] }`,
    {
      json: true
    }, (err, response, body) => {
      if (err) {
        return logger.error('[CryptoSettings] Get public price error', symbol, err);
      }
      if (!body){
        return logger.error('[CryptoSettings] Get public price empty', symbol);
      }
      const cryptoPrice = {
        $set: {
        }
      };
      cryptoPrice.$set[symbol] = body;
      CryptoSettings.findOneAndUpdate({}, cryptoPrice, { upsert: true }).exec((err, result) => {
        if (err) {
          return logger.error('[CryptoSettings] save price error', symbol, err);
        }
      })
  });
}


startSync = () => {
  syncPrice('BTC');
  syncPrice('LTC');
  syncPrice('ETH');
}

startSync();

setInterval(() => {
  startSync();
}, config.cryptoPrice.syncInterval * 1000)