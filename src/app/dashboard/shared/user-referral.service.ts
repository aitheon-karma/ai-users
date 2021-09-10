import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService } from '@aitheon/core-client';
@Injectable({providedIn: 'root'})
export class UserReferralService {

  constructor(private restService: RestService) { }

  getReferral(): Observable<{ referralCode: string, referralCount: number, referralTokenAmount: number }> {
    return this.restService.fetch(`/api/users/referral`);
  }

  inviteReferral(emails: string): Observable<{ alreadyExist: string }> {
    return this.restService.post(`/api/users/referral`, { emails: emails });
  }

  checkIsReferralValid(code: string): Observable<any> {
    return this.restService.fetch(`/api/users/referral/check/${code}`);
  }

}

