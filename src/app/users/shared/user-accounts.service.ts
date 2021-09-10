// tslint:disable-next-line:import-blacklist
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService } from '@aitheon/core-client';

import { User } from './user';

@Injectable()
export class UserAccountsService {

  constructor(private restService: RestService) { }

  list(organizationId: String): Observable<User[]> {
    const orgParam = organizationId ? `organization=${ organizationId }` : '';
    return this.restService.fetch(`/api/users/accounts?${ orgParam }`);
  }

  get(accountType: string, organizationId: String): Observable<User[]> {
    const orgParam = organizationId ? `organization=${ organizationId }` : '';
    return this.restService.fetch(`/api/users/accounts/${ accountType }?${ orgParam }`);
  }

  save(accountType: string, credentials: any, organizationId: String): Observable<User[]> {
    const orgParam = organizationId ? `organization=${ organizationId }` : '';
    return this.restService.post(`/api/users/accounts/${ accountType }?${ orgParam }`, credentials);
  }

  delete(accountType: string, organizationId: String): Observable<User[]> {
    const orgParam = organizationId ? `organization=${ organizationId }` : '';
    return this.restService.delete(`/api/users/accounts/${ accountType }?${ orgParam }`);
  }

  getUpworkToken(): Observable<{ url: string}> {
    // const orgParam = organizationId ? `organization=${ organizationId }` : '';
    return this.restService.post(`/api/users/accounts/UPWORK/token`, {});
  }

  upworkRoles(): Observable<Array<any>> {
    return this.restService.fetch(`/api/users/accounts/UPWORK/roles`);
  }

  saveUpworkRoles(company__reference: string): Observable<void> {
    return this.restService.post(`/api/users/accounts/UPWORK/roles`, { company__reference: company__reference });
  }
}
