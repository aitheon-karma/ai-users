/**
 * Module dependencies.
 */
const userFeeds = require('./user-feeds.controller'),
      userFeedComments = require('./comments/user-feed-comments.controller');
  policy = require('../../core/policy.controller');

module.exports = (app) => {

  app.route('/api/users/:userId/feeds/:postType/:viewType/:pageNo')
    .get(policy.processUser, userFeeds.feeds);

  app.route('/api/users/:userId/public-feeds/:pageNo')
    .get(userFeeds.publicFeeds);

  app.route('/api/users/feed/add/:viewType')
    .post(policy.processUser, userFeeds.addFeed);

  app.route('/api/users/feed/:feedId')
    .put(policy.processUser, userFeeds.updateFeed)
    .delete(policy.processUser, userFeeds.deleteFeed);

  app.route('/api/users/public-feed/:feedId')
    .get(userFeeds.publicFeedById);

  app.route('/api/users/feed/extractURLData')
    .post(policy.processUser, userFeeds.extractURLData);

  app.route('/api/users/feed/:feedId/attachment')
    .put(policy.processUser, userFeeds.updateFeedAttachment);

  app.route('/api/users/feed/:feedId/like')
    .put(policy.processUser, userFeeds.likeFeed);

  app.route('/api/users/feed/:feedId/dislike')
    .put(policy.processUser, userFeeds.dislikeFeed);

  app.route('/api/users/feed/:feedId/share')
    .post(policy.processUser, userFeeds.addShare);

  app.route('/api/users/feeds/views')
    .put(policy.processUser, userFeeds.countViews);

  app.route('/api/users/feed/:feedId/comments')
    .get(policy.processUser, userFeedComments.getCommentsByFeed);

  app.route('/api/users/public-feed/:feedId/comments')
    .get(userFeedComments.getCommentsByPublicFeed);

  app.route('/api/users/:userId/comments')
    .get(policy.processUser, userFeedComments.getCommentsByUser);

  app.route('/api/users/feed/:feedId/comments/add')
    .post(policy.processUser, userFeedComments.addComment);

  app.route('/api/users/feed/comments/:commentId')
    .put(policy.processUser, userFeedComments.updateComment)
    .delete(policy.processUser, userFeedComments.deleteComment);
}
