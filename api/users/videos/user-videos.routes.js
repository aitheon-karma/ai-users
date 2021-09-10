/**
 * Module dependencies.
 */
const policy = require('../../core/policy.controller');
const youtubeVideos = require('./user-videos.controller');

module.exports = (app) => {

  app.route('/api/users/videos/authGoogle')
    .get(policy.processUser, youtubeVideos.authGoogle);

  app.route('/api/users/videos/oauthcallback')
    .get(policy.processUser, youtubeVideos.oauthcallback);

  app.route('/api/users/videos/getPlaylist/:userId')
    .get(policy.processUser, youtubeVideos.getPlaylist);

   app.route('/api/users/videos/unlinkYoutube')
    .delete(policy.processUser, youtubeVideos.unlinkYoutube)

}
