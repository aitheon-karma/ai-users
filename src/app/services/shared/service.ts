export class Service {
  _id: string;
  name: string;
  description: string;
  enabled: boolean;
  dependencies: Array<string>;
  serviceType: string;
  image: string;
  core: boolean;
  url?: string;
  envStatus?: string;
}

export const SERVICE_IGNORE_LIST = ['ADMIN', 'USERS', 'AUTH', 'APP_SERVER', 'PLATFORM_SUPPORT',
                                    'LANDING', 'COMMUNITY', 'TEMPLATE', 'STATUS',
                                    'MAIL', 'BUILD_SERVER', 'SYSTEM_GRAPH', 'UTILITIES'];
