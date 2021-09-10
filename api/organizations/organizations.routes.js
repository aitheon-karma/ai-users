/**
 * Module dependencies.
 */
const organizations = require('./organizations.controller'),
  policy = require('../core/policy.controller'),
  serviceSetup = require('../service-setups/service-setups.controller');
const services = require('../services/services.controller');

module.exports = (app) => {

  app.route('/api/organizations/search')
    .all(policy.processUser)
    .get(organizations.search);

  app.route('/api/me/organizations')
    .get(policy.processUser, organizations.list);

  app.route('/api/organizations')
    .post(policy.processUser, organizations.create);

  app.route('/api/organizations/external')
    .post(policy.processUser, organizations.createForExternal);

  app.route('/api/organization/check-domain/:domain')
    .get(policy.processUser, organizations.domainExists);

  app.route('/api/organization/:organizationId/search/domain')
    .get(organizations.getDomain);

  app.route('/api/organizations/:organizationId/address')
    .get(policy.processUser, organizations.orgAddress)
    .post(policy.processUser, organizations.createNewAddress);

  app.route('/api/organizations/:organizationId/address/:addressId')
    .put(policy.processUser, organizations.updateAddress)
    .delete(policy.processUser, organizations.removeAddress);

  app.route('/api/organizations/test-mode')
    .all(policy.processUser)
    .post(organizations.toggleTestMode);

  app.route('/api/organizations/:organizationId')
    .all(policy.processUser)
    .get(policy.orgIsAllowed, organizations.read)
    .put(policy.orgAdminIsAllowed, organizations.update);

  app.route('/api/organizations/:organizationId/test-mode')
    .all(policy.processUser)
    .get(organizations.checkTestMode);

  app.route('/api/organizations/:organizationId/test-mode/clear')
    .all(policy.processUser)
    .post(policy.orgAdminIsAllowed, organizations.clearTestMode);

  // app.route('/api/organizations/:organizationId/services/:serviceId')
  //   .all(policy.processUser)
  //   .post(policy.orgAdminIsAllowed, organizations.addService)
  //   .delete(policy.orgAdminIsAllowed, organizations.deleteService);
  app.route('/api/organizations/:organizationId/members/:userId')
    .all(policy.processUser)
    .get(organizations.getUser);

  app.route('/api/organizations/:organizationId/email/:email')
    .all(policy.processUser)
    .get(organizations.getUserByEmail);

  app.route('/api/organizations/:organizationId/members')
    .all(policy.processUser)
    .get(organizations.listUsers);

  app.route('/api/organizations/:organizationId/members-search')
    .all(policy.processUser)
    .get(organizations.searchUsers)

  app.route('/api/organizations/:organizationId/search')
    .all(policy.processUser)
    .get(organizations.searchMemberByKey);

  app.route('/api/organizations/:organizationId/member/:userId')
    .all(policy.processUser)
    .post(organizations.addUser)

  app.route('/api/organizations/:organizationId/member/:userId')
    .all(policy.processUser)
    .put(policy.orgUserRoleChangeAbilityAuthorized)
    .put(organizations.updateUser)

  app.route('/api/organizations/:organizationId/member/:userId')
    .all(policy.processUser)
    .delete(organizations.deleteUser)


  app.route('/api/organizations/:organizationId/services')
    .all(policy.processUser)
    .get(organizations.services);

  app.route('/api/organizations/:organizationId/type/services')
    .all(policy.processUser)
    .get(organizations.getOrgTypeServices);

  app.route('/api/organization/:organizationId/updateOrganization')
    .post(policy.processUser, organizations.updateOrganization);

  app.route('/api/organizations/:organizationId/addDocument')
    .all(policy.processUser)
    .post(organizations.addDocument)

  app.route('/api/organizations/:organizationId/document/:documentId')
    .all(policy.processUser)
    .delete(policy.processUser, organizations.removeDocument);

  // app.route('/api/organizations/:organizationId/updateOrganizationServices')
  //   .all(policy.processUser)
  //   .post(organizations.updateOrganizationServices);

  // app.route('/api/organizations/:organizationId/activateService')
  //   .all(policy.processUser)
  //   .post(serviceSetup.activateService, organizations.updateOrganizationServices);


  app.route('/api/organizations/:organizationId/locations')
    .all(policy.processUser)
    .get(organizations.getAllLocations)
    .post(organizations.saveLocations)
    .put(organizations.addLocation);

  app.route('/api/organizations/locations/:locationId')
    .all(policy.processUser)
    .delete(organizations.removeLocation);

  app.route('/api/organization/updateLocation')
    .all(policy.processUser)
    .post(organizations.addLocation)
    .put(organizations.updateLocation);

  app.route('/api/organizations/setup/update-services')
    .all(policy.processUser)
    .put(organizations.updateSetupServices);

  app.route('/api/organizations/:organizationId/addService')
    .all(policy.processUser)
    .post(policy.orgAdminIsAllowed, organizations.attachService);

  app.route('/api/organizations/:organizationId/removeService')
    .all(policy.processUser)
    .post(policy.orgAdminIsAllowed, organizations.detachService);

  //OMS routes


  app.route('/api/organization/accept-organization/:orgId')
    .all(policy.processUser)
    .put(organizations.acceptSupplier);

  app.route('/api/organization/requesters')
    .all(policy.processUser)
    .get(organizations.getRequesterOrganizations);

  //Accounting routes

  app.route('/api/organization/settings')
    .all(policy.processUser)
    .get(organizations.getById)
    .put(organizations.updateSettings);

  // Procurement routes

  app.route('/api/organization/suppliers')
    .all(policy.processUser)
    .get(organizations.mySupplierList);

  app.route('/api/organization/organizationsList')
    .all(policy.processUser)
    .get(organizations.getOrganizationList);

  app.route('/api/organization/changeSupplierStatus')
    .all(policy.processUser)
    .put(organizations.changeSupplierStatus);

  app.route('/api/organization/user/:email')
    .all(policy.processUser)
    .get(organizations.getUserOrganizations);

  app.route('/api/organization/approve-organization/:orgId')
    .all(policy.processUser)
    .put(organizations.approveSupplier);

  app.route('/api/organization/remove-supplier-from-organization/:orgId')
    .all(policy.processUser)
    .put(organizations.removeSupplierFromOrganization);

  app.param('organizationId', organizations.organizationByID);

}
