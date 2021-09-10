/**
 * Module dependencies.
 */
const users = require('./users.controller');
const usersReferral = require('./users-referral.controller');
const usersPassword = require('./users-password.controller');
const telegramBot = require('../telegram/bot');
const config = require('../../config');
const policy = require('../core/policy.controller');

module.exports = (app) => {

  app.route('/api/organizations/:organizationId/users')
    .all(policy.processUser)
    .get(policy.serviceAllowed('HR', 'ServiceAdmin'), users.list);

  app.route('/api/organizations/:organizationId/users/invites')
    .all(policy.processUser, policy.orgAdminIsAllowed)
    .get(users.listInvites)
    .post(users.inviteToOrganization);

  app.route('/api/organizations/:organizationId/users/invites/:inviteId')
    .all(policy.processUser)
    .delete(policy.orgAdminIsAllowed, users.deleteInvite);

  app.route('/api/organizations/:organizationId/users/:userId')
    .all(policy.processUser)
    .put(policy.orgAdminIsAllowed, users.update);

  app.route('/api/organizations/:organizationId/users/:userId/services/:serviceId')
    .all(policy.processUser)
    .put(policy.serviceAllowed('HR', 'ServiceAdmin'), users.addOrgService);

  app.route('/api/users/referral')
    .get(policy.processUser, usersReferral.getReferral)
    .post(policy.processUser, usersReferral.inviteReferral);


  app.route('/api/users/referral/check/:referralCode')
    .get(usersReferral.checkReferral);


  app.route('/api/users/check-email/:email')
    .get(users.checkUserExists)


  app.route('/api/users/username')
    .post(policy.processUser, users.setUsername);


  app.route('/api/users/username/check')
    .post(policy.processUser, users.checkUsername);


  app.route('/api/users/telegram')
    .delete(policy.processUser, users.unlinkTelegram)
    .get(policy.processUser, users.getTelegramLink);

  app.route('/api/users/:userId')
    .get(policy.processUser, users.read);

  app.route('/api/users/me/notifications')
    .post(policy.processUser, users.changeNotifications);

  app.route('/api/users/unsubscribe/:unsubscribeToken')
    .get(users.unsubscribeEmail);

  app.route('/api/users/signup')
    .post(users.signup);

  app.route('/api/users/me/services/:serviceId')
    .all(policy.processUser)
    .put(users.addService)
    .delete(users.deleteService);

  app.route('/api/users/me/dockservices')
    .all(policy.processUser)
    .post(users.updateDockService);

  app.route('/api/users/change-password')
    .post(policy.processUser, usersPassword.changePassword);
  
  app.route('/api/users/validate-password')
    .post(policy.processUser, usersPassword.validatePassword);

  app.route('/api/users/forgot-password')
    .post(usersPassword.forgot);

  app.route('/api/users/reset-password/:token')
    .get(usersPassword.validateResetToken)
    .post(usersPassword.reset);

  app.route('/api/users/profile')
    .put(policy.processUser, users.update);

  app.route('/api/users/:userId/public-profile')
    .get(users.publicProfile);

  app.route('/api/users/profile/search')
    .get(policy.processUser, users.profileSearch);


  app.route('/api/search')
    .get(policy.processUser, policy.processOrganization, users.usersAndTeamsSearch);

  app.route('/api/users/profile/avatar')
    .get(policy.processUser, users.getAvatar)
    .post(policy.processUser, users.uploadAvatar);

  app.route('/api/users/search')
    .post(policy.processUser, policy.processOrganization, policy.orgAdminIsAllowed, users.search);

  app.route('/api/users/organization-invite/:inviteId')
    .get(users.acceptInvite);

  app.route('/api/users/invites/:inviteId/accept')
    .put(policy.processUser, users.acceptInviteNotification);

  app.route('/api/users/invites/:inviteId/decline')
    .put(policy.processUser, users.declineInviteNotification);

  app.route('/api/users/verify-email/:token')
    .get(users.verifyEmail);

  app.route('/api/users/verify-email')
    .post(policy.processUser, users.sendVerifyEmail);

  app.route('/api/users/me').delete(policy.processUser, users.deleteAccount);
  app.route('/api/users/me/devices-pin').get(policy.processUser, users.showDevicesPin);


  app.param('userId', users.userByID);
  app.param('inviteId', users.inviteByID);


  const telegramRoute = `/api/telegram-bot/${config.telegram.botToken}`;
  app.route(telegramRoute)
    .post(telegramBot.webHookMessage)

  app.route('/api/users/me/profile-detail')
    .get(policy.processUser, users.profileDetail);

  app.route('/api/users/profile/:profileTypeId/coverImage')
    .post(policy.processUser, users.uploadCoverImage);

  app.route('/api/users/profile/avatar/remove')
    .put(policy.processUser, users.removeAvatar);

  app.route('/api/users/profile/:profileTypeId/intro')
    .put(policy.processUser, users.updateIntro);

  app.route('/api/users/profile/:profileTypeId/removeCoverImage')
    .put(policy.processUser, users.removeCoverImage);

  app.route('/api/users/profile/permissions')
    .put(policy.processUser, users.updatePermissions);

  app.route('/api/users/profile/search')
    .get(policy.processUser, users.profileSearch);

  app.route('/api/users/profile/status')
    .put(policy.processUser, users.updateStatus);

  app.route('/api/users/profile/security')
    .put(policy.processUser, users.updateSecurity);

  app.route('/api/users/:userId/organizations')
    .get(policy.processUser, users.getFollowingOrganizations);

  app.route('/api/users/:userId/experience')
    .get(policy.processUser, users.getExperience)
    .post(policy.processUser, users.addExperience)
    .put(policy.processUser, users.updateExperience);

  app.route('/api/users/:userId/experience/:experienceId')
    .delete(policy.processUser, users.deleteExperience);

  app.route('/api/users/:userId/licence')
    .get(policy.processUser, users.getLicence)
    .post(policy.processUser, users.addLicence)
    .put(policy.processUser, users.updateLicence);

  app.route('/api/users/:userId/licence/:licenceId')
    .delete(policy.processUser, users.deleteLicence);

  app.route('/api/users/:userId/education')
    .get(policy.processUser, users.getEducation)
    .post(policy.processUser, users.addEducation)
    .put(policy.processUser, users.updateEducation);

  app.route('/api/users/:userId/education/:educationId')
    .delete(policy.processUser, users.deleteEducation);

  app.route('/api/users/mails/mailRouting')
    .put(users.updateRoutingMail);

  app.route('/api/users/onboarding')
    .post(policy.processUser, users.processOnBoarding);

}
