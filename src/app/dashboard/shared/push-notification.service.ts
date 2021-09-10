import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService } from '@aitheon/core-client';


@Injectable({providedIn: 'root'})
export class PushNotificationService {

  constructor(
    private restService: RestService
    ) { }

  requestSubscription(subscription: PushSubscription): Observable<any> {
    return this.restService.post(`/api/push-subscriptions`, subscription);
  }

  notifyUsers(users: string[]): Observable<any> {
    return this.restService.post(`/api/push-subscriptions/notify`, { users });
  }


}

