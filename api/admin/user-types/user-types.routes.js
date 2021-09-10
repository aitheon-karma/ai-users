const userTypes = require('./user-types.controller');
const policy = require('../../core/policy.controller');


//TODO: Add only sys admin access

module.exports = (app) => {
  app.route('/api/admin/user/types')
    .post(policy.processUser, policy.platformRoleOnly, userTypes.create)
    .get(userTypes.list)


  app.route('/api/admin/user/types/:typeId')
     .delete(policy.processUser, policy.platformRoleOnly, userTypes.delete)
     .put(policy.processUser, policy.platformRoleOnly, userTypes.update)

  app.route('/api/admin/user/types/all')
     .get(userTypes.listAll)

  app.route('/api/admin/user/types/:typeId')
     .get(userTypes.getById)
};



