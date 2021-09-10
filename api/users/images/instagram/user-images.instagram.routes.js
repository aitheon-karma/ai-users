/**
 * Module dependencies.
 */
const policy = require('../../../core/policy.controller');
const instagram = require('./user-images.instagram.controller');

module.exports = (app) => {

  app.route('/api/users/instagram/auth')
    .get(policy.processUser, instagram.authInstagram)

  app.route('/api/users/instagram')
    .delete(policy.processUser, instagram.unlinkInstagram)
    .get(policy.processUser, instagram.linkInstagram);

  app.route('/api/users/instagram/:userId/images')
    .get(policy.processUser, instagram.getInstagramImages);

}
