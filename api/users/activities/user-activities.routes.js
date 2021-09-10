/**
 * Module dependencies.
 */
const activities = require('./user-activities.controller'),
  policy = require('../../core/policy.controller');

module.exports = (app) => {
  app.route('/api/activities')
    .get(activities.list)
    .post(activities.create);

};
