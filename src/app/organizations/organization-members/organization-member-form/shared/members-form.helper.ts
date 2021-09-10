import { Service } from 'app/services/shared';

export class MembersSettingsHelperModel {
  service: Service;
  enabled: boolean;
  serviceRole: string;
  role: any;
  enabledByTeam: boolean;

  constructor() {
    this.enabled = false;
  }
}
