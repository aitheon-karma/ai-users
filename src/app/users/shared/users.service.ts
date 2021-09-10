import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService, AuthService, Cookie } from '@aitheon/core-client';

import { User, Organization } from './user';
import { UrlMetadata } from './feed';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private restService: RestService,
    private authService: AuthService) { }

  list(organizationId: string): Observable<User[]> {
    return this.restService.fetch(`/api/organizations/${organizationId}/users`);
  }

  listInvites(organizationId: string): Observable<User[]> {
    return this.restService.fetch(`/api/organizations/${organizationId}/users/invites`);
  }

  profile(userId: string): Observable<User[]> {
    return this.restService.fetch(`/api/users/${userId}/public-profile`);
  }

  updateStatus(status) {
    return this.restService.put(`/api/users/profile/status`, status);
  }

  updateSecurity(security: { isEnabledLoginSecondFactorAuth: boolean }) {
    return this.restService.put(`/api/users/profile/security`, security);
  }

  inviteToOrganization(organizationId: string, user: any): Observable<User> {
    return this.restService.post(`/api/organizations/${organizationId}/users/invites`, user);
  }

  cancelInvite(organizationId, inviteId): Observable<any> {
    return this.restService.delete(`/api/organizations/${organizationId}/users/invites/${inviteId}`);
  }

  update(organizationId: string, user: User, personal: boolean, otpCode: string): Observable<User> {
    let url = personal ? '/api/users/profile' : `/api/organizations/${organizationId}/users/${user._id}`;
    url += `?otpCode=${otpCode}`;
    return this.restService.put(url, user);
  }

  addService(serviceId: string): Observable<any> {
    return this.restService.put(`/api/users/me/services/${serviceId}`, {});
  }

  removeService(serviceId: string): Observable<any> {
    return this.restService.delete(`/api/users/me/services/${serviceId}`);
  }

  signup(user: User): Observable<User> {
    return this.restService.post(`/api/users/signup`, user);
  }

  checkCurrentPassword(request: {password: string}): Observable<any> {
    return this.restService.post(`/api/users/validate-password`, request);
  }

  changePassword(request: { currentPassword: string, password: string }, otpCode: string): Observable<any> {
    return this.restService.post(`/api/users/change-password?otpCode=${otpCode}`, request);
  }

  search(conditions: { email: string }): Observable<User[]> {
    return this.restService.post(`/api/users/search`, conditions);
  }

  resetPassword(token: string, password: string): Observable<{ email: string }> {
    return this.restService.post(`/api/users/reset-password/${token}/`, { password: password });
  }

  forgotPassword(email: string): Observable<void> {
    return this.restService.post(`/api/users/forgot-password`, { email: email });
  }

  unlinkTelegram(): Observable<void> {
    return this.restService.delete(`/api/users/telegram`);
  }

  changeNotifications(unsubscribedEmail: boolean): Observable<void> {
    return this.restService.post(`/api/users/me/notifications`, { unsubscribedEmail: unsubscribedEmail });
  }

  resendVerifyEmail(): Observable<void> {
    return this.restService.post(`/api/users/verify-email`, {});
  }

  deleteAccount(otpCode?: string): Observable<void> {
    let url = `/api/users/me`;
    url += `?otpCode=${otpCode}`;
    return this.restService.delete(url);
  }

  showDevicesPin(otpCode?: string): Observable<any> {
    return this.restService.fetch(`/api/users/me/devices-pin`, { otpCode });
  }

  countriesList(): Observable<any> {
    return this.restService.fetch(`/api/common/countries/getCountries`);
  }

  profileDetail(): Observable<any> {
    return this.restService.fetch(`/api/users/me/profile-detail`);
  }

  removeAvatar(): Observable<any> {
    return this.restService.put(`/api/users/profile/avatar/remove`, {});
  }

  updateIntro(profileType: String, intro: Object): Observable<any> {
    return this.restService.put(`/api/users/profile/${profileType}/intro`, intro);
  }

  removeCoverImage(profileTypeId: any): Observable<any> {
    return this.restService.put('/api/users/profile/' + profileTypeId + '/removeCoverImage', {});
  }

  updatePermissions(permissions: any): Observable<any> {
    return this.restService.put('/api/users/profile/permissions', permissions);
  }

  addFeed(viewType: number, feed: any): Observable<any> {
    return this.restService.post(`/api/users/feed/add/${viewType}`, feed);
  }

  feeds(userId: string, viewType: number, postType: string, pageNo: Object): Observable<any> {
    return this.restService.fetch(`/api/users/${userId}/feeds/${postType}/${viewType}/${pageNo}`);
  }

  publicFeeds(userId: string, pageNo: Object): Observable<any> {
    return this.restService.fetch(`/api/users/${userId}/public-feeds/${pageNo}`);
  }

  feedComments(feedId: string): Observable<any> {
    return this.restService.fetch(`/api/users/feed/${feedId}/comments`);
  }

  publicFeedComments(feedId: string): Observable<any> {
    return this.restService.fetch(`/api/users/public-feed/${feedId}/comments`);
  }

  likeFeed(feedId: string): Observable<any> {
    return this.restService.put(`/api/users/feed/${feedId}/like`, {});
  }

  dislikeFeed(feedId: string): Observable<any> {
    return this.restService.put(`/api/users/feed/${feedId}/dislike`, {});
  }

  countViews(feeds: any): Observable<any> {
    return this.restService.put(`/api/users/feeds/views/`, feeds);
  }

  shareFeed(feedId: string): Observable<any> {
    return this.restService.post(`/api/users/feed/${feedId}/share`, {});
  }

  userComments(userId: string): Observable<any> {
    return this.restService.fetch(`/api/users/${userId}/comments`);
  }

  addComment(feedId: string, comment: any): Observable<any> {
    return this.restService.post(`/api/users/feed/${feedId}/comments/add`, comment);
  }

  updateComment(comment: any): Observable<any> {
    return this.restService.put(`/api/users/feed/comments/${comment._id}`, comment);
  }

  deleteComment(commentId: string): Observable<any> {
    return this.restService.delete(`/api/users/feed/comments/${commentId}`);
  }

  getConnectionFeeds(connectionId: string): Observable<any> {
    return this.restService.fetch(`/api/users/connection/${connectionId}/feeds`);
  }

  timelines(userId: string, viewType: number): Observable<any> {
    return this.restService.fetch(`/api/users/${userId}/timelines/${viewType}`);
  }

  extractURLData(targetUrl: string): Observable<UrlMetadata> {
    return this.restService.post(`/api/users/feed/extractURLData`, { targetUrl });
  }

  removeFeed(feedId: string): Observable<any> {
    return this.restService.delete(`/api/users/feed/${feedId}`);
  }

  updateFeedImage(feedId: any, imageUrl: any, contentType: string): Observable<any> {
    return this.restService.put('/api/users/feed/' + feedId + '/attachment', {
      url: imageUrl,
      contentType: contentType
    });
  }

  updateFeed(feed: any): Observable<any> {
    return this.restService.put(`/api/users/feed/${feed._id}`, feed);
  }

  unlinkInstagram(): Observable<any> {
    return this.restService.delete(`/api/users/instagram`);
  }

  getInstagramImages(userId: string): Observable<any> {
    return this.restService.fetch(`/api/users/instagram/${userId}/images`);
  }

  getFlickrImages(userId: string): Observable<any> {
    return this.restService.fetch(`/api/users/flickr/${userId}/images`);
  }

  unlinkFlickr(): Observable<any> {
    return this.restService.delete(`/api/users/flickr`);
  }

  getauthGoogle(): Observable<any> {
    return this.restService.fetch(`/api/users/videos/authGoogle`);
  }
  getPlaylist(userId: string): Observable<any> {
    return this.restService.fetch(`/api/users/videos/getPlaylist/${userId}`);
  }

  unlinkYoutube(): Observable<any> {
    return this.restService.delete(`/api/users/videos/unlinkYoutube`);
  }

  getFollowingOrganizations(userId: string): Observable<any> {
    return this.restService.fetch(`/api/users/${userId}/organizations`);
  }

  getExperience(userId: string): Observable<any> {
    return this.restService.fetch(`/api/users/${userId}/experience`);
  }

  addExperience(userId: string, experience: any): Observable<any> {
    return this.restService.post(`/api/users/${userId}/experience`, experience);
  }

  updateExperience(userId: string, experience: any): Observable<any> {
    return this.restService.put(`/api/users/${userId}/experience`, experience);
  }

  deleteExperience(userId: string, experience: any): Observable<any> {
    return this.restService.delete(`/api/users/${userId}/experience/${experience._id}`);
  }

  getLicence(userId: string): Observable<any> {
    return this.restService.fetch(`/api/users/${userId}/licence`);
  }

  addLicence(userId: string, licence: any): Observable<any> {
    return this.restService.post(`/api/users/${userId}/licence`, licence);
  }

  updateLicence(userId: string, licence: any): Observable<any> {
    return this.restService.put(`/api/users/${userId}/licence`, licence);
  }

  deleteLicence(userId: string, licence: any): Observable<any> {
    return this.restService.delete(`/api/users/${userId}/licence/${licence._id}`);
  }

  getEducation(userId: string): Observable<any> {
    return this.restService.fetch(`/api/users/${userId}/education`);
  }

  addEducation(userId: string, education: any): Observable<any> {
    return this.restService.post(`/api/users/${userId}/education`, education);
  }

  updateEducation(userId: string, education: any): Observable<any> {
    return this.restService.put(`/api/users/${userId}/education`, education);
  }

  deleteEducation(userId: string, education: any): Observable<any> {
    return this.restService.delete(`/api/users/${userId}/education/${education._id}`);
  }

  getOrganizations(term: string): Observable<Organization[]> {
    return this.restService.fetch(`/api/organizations/search?term=${term}`);
  }

  isUserExists(email: string): Observable<{ exist: boolean, message: string, invalid: boolean }> {
    return this.restService.fetch(`/api/users/check-email/${email}`);
  }

  checkUsername(username: string): Observable<{invalid: boolean, available: boolean}> {
    return this.restService.post(`/api/users/username/check`, {username});
  }

  setUsername(username: string): Observable<any> {
    return this.restService.post(`/api/users/username`, {username});
  }

  // for now we only enable services
  processOnBoarding(services: string[], userTypes: string[]) {
    return this.restService.post('/api/users/onboarding', { services, userTypes });
  }

  getUserActivities(): Observable<any> {
    return this.restService.fetch(`/api/activities`);
  }

  createActivity(activity: { type: string, data: any, user?: any }): Observable<any> {
    return this.restService.post(`/api/activities`, activity);
  }

}
