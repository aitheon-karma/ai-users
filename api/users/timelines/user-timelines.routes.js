/**
 * Module dependencies.
 */
const userTimelines = require('./user-timeline.controller'),
      policy = require('../../core/policy.controller');

module.exports = (app) => {

  app.route('/api/users/:userId/timelines/:viewType')
    .get(policy.processUser, userTimelines.timelines);

}
