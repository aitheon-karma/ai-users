/**
 * Module dependencies.
 */
const questions = require('./questions.controller');
const policy = require('../../core/policy.controller');



/* We do not need the whole list right now.
module.exports = (app) => {
  app.route('/api/admin/questions')
    .get(policy.processUser, questions.list)
    .post(policy.processUser, questions.create);
};
*/

// TODO: Move the questions module to admin section

module.exports = (app) => {
  app.route('/api/admin/questions')
    .post(policy.processUser, policy.platformRoleOnly, questions.create);

  app.route('/api/admin/questions/:target')
    .get(questions.list)


  app.route('/api/admin/questions/:target/tree')
    .get(questions.listTree)

    app.route('/api/admin/questions/:target/service-tree')
    .post(questions.listTreeByServices)

    app.route('/api/admin/questions/:target/service-tree/:service')
    .get(questions.listTreeByService)

  app.route('/api/admin/questions/:target/:parentOption')
    .get(questions.list)

  app.route('/api/admin/questions/:target/:userType')
    .get(questions.listByUserType);

  app.route('/api/admin/question/:questionId')
    .all(policy.processUser)
    .get(questions.getById);

  app.route('/api/admin/questions/:questionId')
    .all(policy.processUser)
    .put(policy.platformRoleOnly, questions.update);

  app.route('/api/admin/questions/:questionId')
     .delete(policy.processUser, policy.platformRoleOnly, questions.delete)
};







