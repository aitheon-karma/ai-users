import { Service } from '../../services/shared';
import { Address, PhoneNumber, Location } from '../../shared/Location';
import { QuizAnswer } from '../../shared/questions/shared/question';

export class Organization {
  _id: string;
  name: string;
  domain: string;
  locations: Array<Location>;
  parent: string;

  registeredOfficeDetails: {
    phoneNumbers: PhoneNumber[],
    faxNumbers: PhoneNumber[]
    address: Address
  };

  services: Array<{
    service: Service,
    enabled: boolean
  }> | Array<string>;

  profile: {
    intro: string;
    avatarResolutions: any;
    avatarUrl: string;
  };

  documents: Array<OrgDocument>;

  constructor() {
    this.locations = [];
  }
}

export class OrgDocument {
  driveFile: string;
  createdAt: string;
  fileName: string;
  contentType: string;
  url: string;
  docType: string;
  size: number;
  _id: string;
}
