/**
 * Module dependencies.
 */
const usersKYC = require('./users.kyc.controller');
const config = require('../../../config');
const policy = require('../../core/policy.controller');

module.exports = (app) => {
  
  app.route('/api/users/kyc/documents')
    .get(policy.processUser, usersKYC.listDocuments)
    .post(policy.processUser, usersKYC.uploadDocument);

  app.route('/api/users/kyc/documents/photoid')
    .post(policy.processUser, usersKYC.savePhotoIDNumber);
    
}
