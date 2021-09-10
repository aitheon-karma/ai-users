export class NotificationSettings {
  user: any;
  organization: any;
  email?: NotificationTypeSettings;
  push?: NotificationTypeSettings;
}

export class NotificationTypeSettingsService {
  _id?: string;
  serviceId: string;
  enabled: boolean;
  actions: [string]
}

export class NotificationTypeSettings {
  _id?: string;
  enabled: boolean;
  services: [NotificationTypeSettingsService];
}
