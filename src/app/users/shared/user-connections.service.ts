import { Observable, BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService, AuthService } from '@aitheon/core-client';
import { environment } from 'environments/environment';
import { analyzeAndValidateNgModules } from '@angular/compiler';

@Injectable({providedIn: 'root'})
export class UserConnectionsService {

  /// to keep list of active connections to current profile
  ProfileConnections: BehaviorSubject<any[]> = new BehaviorSubject([]);
  /// to keep connection loading status.
  IsProfileConnectionsLoading: BehaviorSubject<boolean> = new BehaviorSubject(false);

  private connectionListUserId: string = undefined;
  private connectionListProfileId: string = undefined;
  private connectionProfileType: string = undefined;

  constructor(private restService: RestService) {

  }

  // to create a new connection request.
  addConnectionRequest(userId: string, profileAccessibility: any): Observable<any> {
    return this.restService.post(`/api/users/connection/${userId}/request`, { profileAccessibility: profileAccessibility });
  }

  // to get connection status between two profiles
  getConnectionStatus(userId: string): Observable<any> {
    return this.restService.fetch(`/api/users/connection/${userId}/status`);
  }

  // to reject a connection request
  rejectConnectionRequest(connectionId: string): Observable<any> {
    return this.restService.put(`/api/users/connection/${connectionId}/reject`, {});
  }

  // to delete a connection request
  deleteConnectionRequest(connectionId: string): Observable<any> {
    return this.restService.delete(`/api/users/connection/${connectionId}/delete`);
  }

  // to accept a connection request
  acceptConnectionRequest(connectionId: string, profileAccessibility: any): Observable<any> {
    return this.restService.put(`/api/users/connection/${connectionId}/accept`, { profileAccessibility: profileAccessibility });
  }

  // to close an existing connection
  closeConnection(connectionId: string): Observable<any> {
    return this.restService.put(`/api/users/connection/${connectionId}/close`, {});
  }

  // to get profile connections.
  getProfileConnections(currentUserId: string, profileId: string = null, profileType: string = null) {
    this.connectionListUserId = currentUserId;
    this.connectionListProfileId = profileId;
    this.connectionProfileType = profileType;

    this.reloadConnections();
  }

  // to reload connections.
  reloadConnections(): void {
    if (this.connectionListUserId === null || this.connectionListUserId === undefined || this.connectionListUserId === '') {
      return;
    }

    this.IsProfileConnectionsLoading.next(true);

    let body: any = {};
    let isSelfProfile = true;
    if (this.connectionListProfileId !== null && this.connectionListProfileId !== undefined && this.connectionListProfileId !== '') {
      body = {
        user: this.connectionListProfileId
      };
      isSelfProfile = false;
    }

    if (this.connectionProfileType !== null && this.connectionProfileType !== undefined && this.connectionProfileType !== '') {
      body.profileType = this.connectionProfileType;
    }

    this.restService.post(`${environment.baseApi}${environment.contactsUrl}/api/contacts/connections`, body, true).subscribe((contacts: any) => {

      if (contacts === null || contacts === undefined || contacts === '') {
        this.ProfileConnections.next([]);
        this.IsProfileConnectionsLoading.next(false);
        return;
      }

      if (isSelfProfile) {
        contacts.forEach(function (contact) {
          contact.status = 'ACCEPTED';
        });
        this.ProfileConnections.next(contacts);
        this.IsProfileConnectionsLoading.next(false);
        return;
      } else {

        this.restService.fetch(`/api/users/connection/statusList`).subscribe((connections: any[]) => {

          if (connections === null || connections === undefined) {
            contacts.forEach(function (contact) {
              contact.status = 'NONE';
              contact.connectionId = undefined;
            });
          }

          const service = this;
          let contactConnectionData: any[];
          contacts.forEach(function (contact) {

            if (contact.linkedProfile._id.toString() === service.connectionListUserId) {
              contact.status = 'CURRENT';
            } else {
              contactConnectionData = connections.filter(connection => contact.linkedProfile._id === connection.fromUser);
              if (contactConnectionData !== null && contactConnectionData !== undefined && contactConnectionData.length > 0) {
                contact.connectionId = contactConnectionData[0]._id;
                if (contactConnectionData[0].status === 'REQUESTED') {
                  contact.status = 'REQUESTEDFROM';
                } else {
                  contact.status = contactConnectionData[0].status;
                }
              } else {
                contactConnectionData = connections.filter(connection => contact.linkedProfile._id === connection.toUser);
                if (contactConnectionData !== null && contactConnectionData !== undefined && contactConnectionData.length > 0) {
                  contact.connectionId = contactConnectionData[0]._id;
                  contact.status = contactConnectionData[0].status;
                } else {
                  contact.connectionId = undefined;
                  contact.status = 'NONE';
                }
              }
            }

          });

          this.ProfileConnections.next(contacts);
          this.IsProfileConnectionsLoading.next(false);
        }, (error) => {
          this.ProfileConnections.next([]);
          this.IsProfileConnectionsLoading.next(false);
          return;
        });
      }


    }, (error) => {
      this.ProfileConnections.next([]);
    });
  }

  // to check whether a profile is in current users contact.
  isMyContact(userId: string): Observable<any> {
    return this.restService.post(`${environment.baseApi}${environment.contactsUrl}/api/contacts/isMyContact`, {
      toId: userId
    }, true);
  }

  // to get current users connection object from contacts of current profile
  getUserConnectionFromProfile(profileId: string, currentUserId: string): Observable<any> {
    return this.restService.post(`${environment.baseApi}${environment.contactsUrl}/api/contacts/isMyContact`, {
      fromId: profileId,
      toId: currentUserId
    }, true);
  }

  // to update profile accessibility of a connection.
  setProfileAccessibility(contactId: string, profileAccessibility: any): Observable<any> {
    return this.restService.put(`/api/users/connection/profileAccessiblity`, {
      contactId: contactId,
      profileAccessibility: profileAccessibility
    });
  }

}
