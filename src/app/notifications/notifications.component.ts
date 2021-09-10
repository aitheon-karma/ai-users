import { ToastrService } from 'ngx-toastr';
import { Notification, NotificationsService } from '@aitheon/core-client';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'fl-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent implements OnInit {

  notifications: Notification[];
  constructor(
    private toastr: ToastrService,
    private notificationsService: NotificationsService
  ) { }

  ngOnInit() {
    this.loadNotifications();
  }


  loadNotifications(): void {
    this.notificationsService.list(true).subscribe((notifications: Notification[]) => {
      this.notifications = notifications;
    }, (err: any) => {
      this.toastr.error(err);
    });
  }

  markAsRead(notification: Notification): void {
    this.notificationsService.markAsRead(notification._id).subscribe(() => {
      notification.read = true;
    }, (err: any) => {
      this.toastr.error(err);
    });
  }

  declineOrgInvite(notification: Notification): void {
    const inviteId = notification.actionData.inviteId;
    this.notificationsService.declineOrgInvite(inviteId).subscribe(() => {
      this.markAsRead(notification);
    }, (err: any) => {
      this.toastr.error(err);
    });
  }

  acceptOrgInvite(notification: Notification): void {
    const inviteId = notification.actionData.inviteId;
    this.notificationsService.acceptOrgInvite(inviteId).subscribe(() => {
      this.markAsRead(notification);
    }, (err: any) => {
      this.toastr.error(err);
    });
  }
}
