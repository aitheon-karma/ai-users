import { Widget } from './widget';

export class DashboardSettings {
  _id: string;
  init: Boolean;
  allWidgets: Widget[];
  skipWelcomeVideo?: boolean;
  organization?: any;
  user: any;
  isFirstCreated?: boolean;
  hideServiceMap?: boolean;
}
