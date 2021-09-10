import { AbstractControl, ValidatorFn } from '@angular/forms';

export function organizationDomainValidator(): ValidatorFn {
  const domainRegex = /^[a-zA-Z0-9]+([-][a-zA-Z0-9]+)*[a-zA-Z0-9]$/;
  return (control: AbstractControl): {[key: string]: any} => {
    const name = control.value;
    const valid = domainRegex.test(name);
    return valid ? null : { 'domain-allowed' : 'Domain is not valid' };
  };
}