/**
 * Module dependencies.
 */
const organizations_public_profile = require('./organizations-public-profile.controller'),
      policy = require('../../core/policy.controller');

module.exports = (app) => {

  app.route('/api/organizations/:organizationId/public-profile')
    .get(policy.processUser, organizations_public_profile.publicProfile);

  app.route('/api/organizations/:organizationId/public-profile/coverImage')
    .all(policy.processUser)
    .post(policy.orgAdminIsAllowed, organizations_public_profile.uploadCoverImage);

  app.route('/api/organizations/:organizationId/public-profile/removeCoverImage')
    .all(policy.processUser)
    .put(policy.orgAdminIsAllowed, organizations_public_profile.removeCoverImage);

  app.route('/api/organizations/:organizationId/public-profile/avatar')
    .all(policy.processUser)
    .get(organizations_public_profile.getAvatar)
    .post(policy.orgAdminIsAllowed, organizations_public_profile.uploadAvatar);

  app.route('/api/organizations/:organizationId/public-profile/removeAvatarImage')
    .all(policy.processUser)
    .put(policy.orgAdminIsAllowed, organizations_public_profile.removeAvatarImage); 
   
  app.route('/api/organizations/:organizationId/public-profile/intro')
    .all(policy.processUser)
    .put(policy.orgAdminIsAllowed, organizations_public_profile.updateIntro);

  app.route('/api/organizations/:organizationId/public-profile/updateGeneralInfo')
    .all(policy.processUser)
    .put(policy.orgAdminIsAllowed, organizations_public_profile.updateGeneralInfo);

  app.route('/api/organizations/:organizationId/public-profile/follow')
    .all(policy.processUser)
    .get(organizations_public_profile.getFollowStatus)
    .post(organizations_public_profile.follow)
    .delete(organizations_public_profile.unfollow);

  app.route('/api/organizations/:organizationId/public-profile/organizationfollowers')
    .all(policy.processUser)
    .get(organizations_public_profile.getOrganizationFollowers);
}
