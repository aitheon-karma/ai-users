export class Project {
  _id: string;
  projectType: ProjectType;
  publish: {
    online: Boolean;
    url: string;
    lastUpdated: Date;
    build: string;
  };
  checked: boolean;
}

export enum ProjectType {
  APP = 'APP',
  SERVICE = 'SERVICE',
  INTERFACE = 'INTERFACE',
  DIGIBOT = 'DIGIBOT',
  MECHBOT = 'MECHBOT',
  MECHBOT_NODE = 'MECHBOT_NODE',
  DEVICE = 'DEVICE'
}
