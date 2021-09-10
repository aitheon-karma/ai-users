import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService } from '@aitheon/core-client';
import { Organization, OrgDocument } from './organization';
import { Address, Location } from '../../shared/Location';
import { map } from 'rxjs/operators';
import { User } from '../../users/shared';

@Injectable({ providedIn: 'root' })
export class OrganizationsService {

  constructor(private restService: RestService) { }

  getOrg(id: string): Observable<Organization> {
    return this.restService.fetch(`/api/organizations/${id}`);
  }

  list(): Observable<Organization[]> {
    return this.restService.fetch(`/api/me/organizations`);
  }

  create(organization: Organization): Observable<Organization> {
    return this.restService.post(`/api/organizations`, organization);
  }

  getOrgAddress(organization: Organization): Observable<Organization> {
    return this.restService.fetch(`/api/organizations/${organization._id}/address`);
  }

  createNewAddress(organization: Organization, address: Address): Observable<Organization> {
    return this.restService.post(`/api/organizations/${organization._id}/address`, address);
  }

  updateCurrentAddress(organization: Organization, address: Address, addressId: any): Observable<Organization> {
    return this.restService.put(`/api/organizations/${organization._id}/address/${addressId}`, address);
  }

  deleteCurrentAddress(organization: Organization, address: Address): Observable<Organization> {
    return this.restService.delete(`/api/organizations/${organization._id}/address/${address._id}`);
  }

  update(organization: Organization): Observable<Organization> {
    return this.restService.put(`/api/organizations/${organization._id}`, organization);
  }

  addService(organizationId: string, serviceId: string): Observable<Organization> {
    return this.restService.post(`/api/organizations/${organizationId}/addService`, {service: serviceId});
  }

  removeService(organizationId: string, serviceId: string): Observable<Organization> {
    return this.restService.post(`/api/organizations/${organizationId}/removeService`, {service: serviceId});
  }

  publicProfile(organizationId: string): Observable<Organization[]> {
    return this.restService.fetch(`/api/organizations/${organizationId}/public-profile`);
  }

  removeCoverImage(organizationId: string): Observable<any> {
    return this.restService.put(`/api/organizations/${organizationId}/public-profile/removeCoverImage`, {});
  }

  updateIntro(organizationId: string, intro: Object): Observable<any> {
    return this.restService.put(`/api/organizations/${organizationId}/public-profile/intro`, intro);
  }

  removeAvatar(organizationId: string): Observable<any> {
    return this.restService.put(`/api/organizations/${organizationId}/public-profile/removeAvatarImage`, {});
  }

  updateOrganizationGeneralInfo(organizationId: string, generalInfo: Object): Observable<any> {
    return this.restService.put(`/api/organizations/${organizationId}/public-profile/updateGeneralInfo`, generalInfo);
  }

  followOrganization(organizationId: string): Observable<any> {
    return this.restService.post(`/api/organizations/${organizationId}/public-profile/follow`, {});
  }

  unfollowOrganization(organizationId: string): Observable<any> {
    return this.restService.delete(`/api/organizations/${organizationId}/public-profile/follow`);
  }

  getfollowingStatus(organizationId: string): Observable<any> {
    return this.restService.fetch(`/api/organizations/${organizationId}/public-profile/follow`);
  }

  getOrganizationFollowers(organizationId: string): Observable<any> {
    return this.restService.fetch(`/api/organizations/${organizationId}/public-profile/organizationfollowers`);
  }

  searchUsers(organizationId: string, searchKey: string): Observable<any> {
    return this.restService.fetch(`/api/organizations/${organizationId}/members-search?searchKey=` + encodeURIComponent(searchKey));
  }

  getMembers(organizationId: string): Observable<User[]> {
    return this.restService.fetch(`/api/organizations/${organizationId}/members`);
  }

  getTeams(organizationId: string): Observable<any> {
    return this.restService.fetch(`/api/organizations/${organizationId}/teams`);
  }



  addUser(data: any, organizationId: string, userId: string): Observable<any> {
    return this.restService.post(`/api/organizations/${organizationId}/member/${userId}`, data);
  }

  getOrgServices(organizationId: string): Observable<any> {
    return this.restService.fetch(`/api/organizations/${organizationId}/services`);
  }

  getAllServices(organizationId): Observable<any> {
    return this.restService.fetch(`/api/organizations/${organizationId}/type/services`);
  }

  updateOrganization(data: any, organizationId: string): Observable<any> {
    return this.restService.post(`/api/organization/${organizationId}/updateOrganization`, { data, organizationId });
  }


  addDocument(organizationId: string, document: OrgDocument) {
    return this.restService.post(`/api/organizations/${organizationId}/addDocument`, document);
  }

  removeDocument(organizationId: string, documentId: string) {
    return this.restService.delete(`/api/organizations/${organizationId}/document/${documentId}`);
  }

  getOneUser(organizationId, userId): Observable<any> {
    return this.restService.fetch(`/api/organizations/${organizationId}/members/${userId}`);
  }

  getOneUserByEmail(organizationId, email): Observable<any> {
    return this.restService.fetch(`/api/organizations/${organizationId}/email/${email}`);
  }

  updateUser(data: any, organizationId: string, userId: string): Observable<any> {
    return this.restService.put(`/api/organizations/${organizationId}/member/${userId}`, data);
  }

  updateOrganizationServices(data: any, organizationId: string, add) {
    if(add === true){
      return this.restService.post(`/api/organizations/${organizationId}/addService`, data);
    }else{
      return this.restService.post(`/api/organizations/${organizationId}/removeService`, data);
    }
  }

  activateService(data: any, organizationId: string) {
    return this.restService.post(`/api/organizations/${organizationId}/addService`, data);
  }

  listServiceSetups() {
    return this.restService.fetch(`/api/service-setups`);
  }

  removeServiceConfig(service: string): Observable<any> {
    return this.restService.delete(`/api/service-setups/${service}`);
  }

  addServiceConfig(service: string, organization: string): Observable<any> {
    return this.restService.post(`/api/service-setups`, { service, organization });
  }

  deleteUser(organizationId: string, userId: string): Observable<any> {
    return this.restService.delete(`/api/organizations/${organizationId}/member/${userId}`);
  }

  sendInvite(organizationId: string, data: any) {
    return this.restService.post(`/api/organizations/${organizationId}/users/invites`, data);
  }

  deleteInvite(organizationId: string, inviteId: string) {
    return this.restService.delete(`/api/organizations/${organizationId}/users/invites/${inviteId}`);
  }

  getAllLocations(organizationId: string): Observable<Location[]> {
    return this.restService.fetch(`/api/organizations/${organizationId}/locations`)
      .pipe(map(data => data.locations));
  }

  // This method takes all the locations and deletes or adds based on the data passed.
  processMultipleLocations(organizationId: string, locations: Location[]): Observable<any> {
    return this.restService.post(`/api/organizations/${organizationId}/locations`, locations);
  }

  updateLocation(location: Location): Observable<any> {
    return this.restService.put(`/api/organization/updateLocation`, location);
  }

  createLocation(location: Location): Observable<any> {
    return this.restService.post(`/api/organization/updateLocation`, { location });
  }

  removeLocation(locationId: string): Observable<any> {
    return this.restService.delete(`/api/organizations/locations/${locationId}`);
  }

  getInvitedUsers(organizationId: string) {
    return this.restService.fetch(`/api/organizations/${organizationId}/users/invites`);
  }


  createForExternal(organization: any): Observable<any> {
    return this.restService.post(`/api/organizations/external`, organization);
  }

  updateSupplierStatus(data: any): Observable<any> {
    return this.restService.put(`/api/organization/changeSupplierStatus`, data);
  }

  approveSupplier(orgID) {
    return this.restService.put(`/api/organization/accept-organization/` + orgID, {});
  }


  checkDomain(domain: string) {
    return this.restService.fetch(`/api/organization/check-domain/${domain}`);
  }

  updateServicesConfig(services: string[]): Observable<any> {
    return this.restService.put(`/api/organizations/setup/update-services`, { services });
  }

  getSeviceEmailList() {
    return this.restService.fetch(`/api/service-emails`);
  }
  createServiceEmail(body: any): Observable<any> {
    return this.restService.post(`/api/service-emails`, body);
  }
  createServiceEmailToken(serviceEmailId, data) {
    return this.restService.put(`/api/service-email/update/auth-token/` + serviceEmailId, data);
  }
  deleteSeviceEmail(serviceEmailId) {
    return this.restService.delete(`/api/service-email/${serviceEmailId}`);
  }
  checkServiceEmailValid(serviceEmail) {
    return this.restService.fetch(`/api/service-email/availibility/${serviceEmail}`);
  }
}

