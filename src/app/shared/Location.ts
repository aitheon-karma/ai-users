export class Location {
  _id: string;
  name: string;
  type: string;
  address: Address;
  fax: string;
  phoneNumbers: Array<PhoneNumber>;
  emails: Array<Email>;
  position?: MapPosition;
}

export class MapPosition {
  lat: number;
  lng: number;
  formattedAddress: string;
}

export class Address {
  _id: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  regionState: string;
  country: string;
  code: string;
}

export class PhoneNumber {
  type: PhoneNumberType;
  number: string;
}

export class Email {
  type: EmailType;
  email: string;
}

export enum PhoneNumberType {
  HOME = 'HOME',
  WORK = 'WORK',
  OTHER = 'OTHER'
}

export enum EmailType {
  PERSONAL = 'PERSONAL',
  WORK = 'WORK',
  OTHER = 'OTHER'
}
