import { UserRole } from './user-role';
import { Address } from '../../shared/Location';

export class User {
  _id: string;
  email: string;
  password: string;
  KYCStatus: KYCStatus;
  profile: {
    firstName: string;
    lastName: string;
    birthday: string;
    avatarUrl: string;
    currentAddress: Address;
    homeAddress: Address;
    phoneNumber: string;
    headline: string;
    gender: string;
    maritalStatus: string;
    languages: Array<string>;
    interests: Array<string>;
    politicalViews: Array<string>;
    socialProfiles: {
      twitter: string,
      instagram: string,
      pinterest: string
    },
    experience: Array<Experience>
    education: Array<Education>;
    licence: Array<Licence>;
  };
  personal: {
    intro: string;
    coverImageUrl: string;
    introBackgroundStyle: string;
    introTextStyle: string;
  };
  professional: {
    intro: string;
    coverImageUrl: string;
    introBackgroundStyle: string;
    introTextStyle: string;
  };
  dating: {
    intro: string;
    coverImageUrl: string;
    introBackgroundStyle: string;
    introTextStyle: string;
  };
  permissions: UserViewPermissions;
  disabled: boolean;
  roles: Array<UserRole>;
  organizationRole: UserRole;
  services: Array<string>;
  updatedAt: string;
  unsubscribedEmail: boolean;
  emailVerified: boolean;
  isEnabledLoginSecondFactorAuth: boolean;

  constructor() {
    this.profile = {
      lastName: '',
      firstName: '',
      birthday: '',
      avatarUrl: '',
      phoneNumber: '',
      headline: '',
      currentAddress: new Address(),
      gender: '',
      homeAddress: new Address(),
      interests: [],
      languages: [],
      maritalStatus: '',
      politicalViews: [],
      socialProfiles: null,
      experience: [],
      education: [],
      licence: []
    };
    this.disabled = false;
    this.roles = [];
    this.services = [];
  }
  emailRouting: {
    emailPrefix: String
  };
}

export class Education {
  _id: string;
  uploadFile: string;
  org: Organization;
  department: string;
  eduYear: string;
}

export class Licence {
  _id: string;
  uploadFile: string;
  licencestitle: string;
  org: Organization;
  credentialid: string;
}

export class Experience {
  _id: string;
  uploadFile: string;
  roleName: string;
  org: Organization;
  expDay: string;
  expMonth: string;
  expYear: string;
  expToDay: string;
  expToMonth: string;
  expToYear: string;
  currentWorkHere: string;
  addressLine1: string;
  addressLine2: string;
  aboutText: string;
}
export class Organization {
  _id: string;
  name: string;
}

export enum KYCStatus {
  'NONE', // have not uploaded documents
  'PENDING', // Documents uploaded, waiting for image recognition of ID
  'IMAGE_VERIFIED', // Images matched ID
  'VERIFY_FINISHED', // kyc background check run on verified ID and passed
  'DENIED_IMAGE', // Documents failed Image recognition
  'DENIED_BACKGROUND'
}

export class UserViewPermissions {
  personalView: {
    personal: boolean;
    professional: boolean;
    dating: boolean;
  };
  organizationalView: {
    personal: boolean;
    professional: boolean;
    dating: boolean;
  };
  datingView: {
    personal: boolean;
    professional: boolean;
    dating: boolean;
  };
  constructor() {
    this.personalView = {
      personal: true,
      professional: false,
      dating: false
    };
    this.organizationalView = {
      personal: false,
      professional: true,
      dating: false
    };
    this.datingView = {
      personal: false,
      professional: false,
      dating: true
    };
  }
}

export class AddressAccessibility {
  addressLine1: boolean;
  addressLine2: boolean;
  city: boolean;
  regionState: boolean;
  country: boolean;
  code: boolean;
  constructor() {
    this.addressLine1 = true;
    this.addressLine2 = true;
    this.city = true;
    this.regionState = true;
    this.country = true;
    this.code = true;
  }
}

