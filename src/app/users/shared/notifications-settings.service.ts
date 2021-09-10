// tslint:disable-next-line:import-blacklist
import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService } from '@aitheon/core-client';
import { NotificationSettings } from './notification-settings';


@Injectable({
  providedIn: 'root'
})
export class NotificationsSettingsService {

  constructor(
    private restService: RestService
  ) { }

  list(): Observable<NotificationSettings[]> {
    return this.restService.fetch(`/api/notification-settings`);
  }

  updateOrgs(body: { data: NotificationSettings[]}): Observable<NotificationSettings[]> {
    return this.restService.post(`/api/notification-settings`, body);
  }

}
