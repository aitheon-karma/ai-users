/**
 * Module dependencies.
 */
const answers = require('./answers.controller');
const policy = require('../../core/policy.controller');


module.exports = (app) => {
  app.route('/api/admin/answers')
    .get(policy.processUser, answers.list);

  app.route('/api/admin/answers')
    .post(policy.processUser, answers.create);

  app.route('/api/admin/answers/:answerId')
    .all(policy.processUser)
    .put(policy.platformRoleOnly, answers.update);

  app.route('/api/admin/answers/questions/:questionId')
    .delete(policy.processUser, answers.deleteByQuestion)

  app.route('/api/admin/answers/:answerId')
     .delete(policy.processUser, answers.delete)

  app.route('/api/admin/answers/remove')
     .post(policy.processUser, answers.removePrevious)
};







