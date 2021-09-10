/**
 * Module dependencies.
 */
const policy = require('../../../core/policy.controller');
const flickr = require('./user-images.flickr.controller');

module.exports = (app) => {

  app.route('/api/users/flickr/auth')
  .get(policy.processUser, flickr.getRequestWithHeaders);

  app.route('/api/users/flickr/oauth/authorize')
    .get(policy.processUser, flickr.getAuthorizationFlickr);

  app.route('/api/users/flickr/accessToken')
    .get(policy.processUser, flickr.getAccessToken);

  app.route('/api/users/flickr/UserLogin')
    .get(policy.processUser, flickr.getFlickrUserLogin);

  app.route('/api/users/flickr/:userId/images')
    .get(policy.processUser, flickr.getFlickrImages);

  app.route('/api/users/flickr')
    .delete(policy.processUser, flickr.unlinkFlickr);

}
