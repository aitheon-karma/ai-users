import { Component, OnInit, AfterViewChecked, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';

import { OrganizationsService, Organization } from './../shared';
import { ToastrService } from 'ngx-toastr';
import { UsersService } from 'app/users/shared';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'fl-organization-form',
  templateUrl: './organization-form.component.html',
  styleUrls: ['./organization-form.component.scss']
})
export class OrganizationFormComponent implements OnInit, AfterViewChecked {

  @Input() organization: Organization;
  @Input() isExternal: Organization;
  @Input() organizations: Array<Organization>;
  @Output() canceled: EventEmitter<any> = new EventEmitter<any>();
  @Output() saved: EventEmitter<Organization> = new EventEmitter<Organization>();
  @Output() updated: EventEmitter<Organization> = new EventEmitter<Organization>();

  submitted = false;
  organizationForm: FormGroup;
  error: any;
  activeParent: any;
  countriesStates: {countries: [{ country: string, states: string[] }]};
  nameMask = /^[a-zA-Z0-9\s-]+$/;
  cityMask = /^[a-zA-Z\s-]*$/;
  domainMask = /^[a-zA-Z0-9\-]+$/;
  zipMask = /^[A-Za-z0-9\s-]*/;
  countries: Array<string> = [];
  orgName = '';
  submitButtonText: string;

  private banner: HTMLElement;
  private isBannerHidden: boolean = false;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private userService: UsersService,
    private organizationsService: OrganizationsService) { }

  get isNew() {
    return this.organization && !this.organization._id;
  }

  get organizationName(): AbstractControl {
    return this.organizationForm.get('name');
  }

  get organizationDomain(): AbstractControl {
    return this.organizationForm.get('domain');
  }

  ngOnInit() {
    this.buildForm(this.organization);
    this.submitButtonText = this.isNew ? 'Create' : 'Update';
    let org: any;
    const parent = this.organizationForm.get('parent').value;
    if (parent && this.organizations) {
      org = this.organizations.find((o: Organization) => o._id === parent);
    }
    if (org) {
      this.activeParent = [org];
    } else {
      this.activeParent = null;
    }
  }

  ngAfterViewChecked() {
    if (!this.banner) {
      this.hideBanner();
    }
  }

  buildForm(organization: Organization): void {
    if (this.isNew) {
      this.organizationForm = this.fb.group({
        name: ['', [
          Validators.required,
          Validators.pattern(this.nameMask),
          Validators.minLength(3),
          Validators.maxLength(30)
        ]],
        domain: ['', [Validators.required]],
        parent: [organization.parent, null]
      });
    } else {
      this.organizationForm = this.fb.group({
        name: [this.organization.name, [Validators.required, Validators.pattern(this.nameMask), Validators.minLength(3)]],
        domain: [this.organization.domain, [Validators.required]],
        profile: this.fb.group({
          intro: [this.organization.profile.intro],
          avatarResolutions: [this.organization.profile['avatarResolutions']],
          avatarUrl: [this.organization.profile['avatarUrl']]
        }),
        parent: [organization.parent, null]
      });
    }
  }

  isCorrectInput(event: KeyboardEvent): boolean {
    const isSpacePressed = event.keyCode === 32 || event.code === 'Space' || event.key === ' ';
    const valueLength = this.organizationName.value.length;
    const isToBePrevented = isSpacePressed
      ? (!valueLength || this.organizationName.value[valueLength - 1] === ' ')
      : false;

    return !isToBePrevented;
  }

  onChange(name: string) {
    const domainName = this.getFormattedDomainName(name);
    this.organizationForm.get('domain').setValue(domainName);
    this.submitted = false;
    this.error = null;
  }

  onSubmit({ value, valid }: { value: any, valid: boolean }): void {

    this.submitted = true;

    if (!valid) {
      return;
    }

    let organizationToChange = Object.assign({}, this.organization);

    const org = Object.assign(organizationToChange, value);
    org.domain = org.domain.toLowerCase();
    this.error = null;

    if (this.isNew) {
      this.organization.name = value.name;
      this.organization.domain = org.domain.toLowerCase();
      this.organizationsService.checkDomain(value.domain).subscribe(() => {
        this.organization.locations = value.locations;
        this.createOrg(this.organization);
      }, () => {
        this.organizationForm.get('domain').setErrors({domainUsed: true});
      });
    } else {
      if (!this.organization.profile.avatarResolutions || ! this.organization.profile.avatarUrl) {
        delete this.organization.profile.avatarResolutions;
        delete this.organization.profile.avatarUrl;
      }
      this.updateOrg(org);
    }
  }

  updateOrg(organization: Organization): void {
    this.organizationsService.update(organization).subscribe((o: Organization) => {
      this.updated.emit(o);
    }, (error) => this.handleError(error));
  }

  createOrg(organization: Organization): void {
    const setupService = localStorage.getItem('signup-service');
    if (setupService) {
      organization.services = [setupService];
    }
    this.organizationsService.create(organization).subscribe((o: Organization) => {
      this.organization._id = o._id;
      this.saved.emit(this.organization);
    }, (error) => this.handleError(error));
  }

  handleError(response: any) {
    try {
      response = JSON.parse(response);
      response = response.message;
    } catch (err) { }
    this.error = response;
  }

  cancel(): void {
    const relocateUrl = environment.production ? '/users/dashboard' : '/dashboard';
    location.href = relocateUrl;
    // OLD_FLOW(remove if no need)
    // this.organizationForm.reset(this.organization);
    // this.canceled.emit();
  }

  selectedParent(value: { id: string, text: string }): void {
    this.organizationForm.get('parent').setValue(value.id);
  }

  removedParent(): void {
    this.organizationForm.get('parent').setValue(null);
  }

  loadCountries() {
    this.userService.countriesList().subscribe((countries: {countries: [{ country: string, states: string[] }]} ) => {
      this.countriesStates = countries;
      this.countries = countries.countries.map(country => country.country);
    });
  }

  getNameError() {
    let result = '';

    const isFrontValidationFailed = this.organizationName.invalid;
    const isRequired = this.organizationName.hasError('required');
    const isMinLengthError = this.organizationName.hasError('minlength');
    const isMaxLengthError = this.organizationName.hasError('maxlength');

    if (isFrontValidationFailed) {
      result = isRequired
        ? 'Name is required'
        : isMinLengthError
          ? 'The minimum number of characters must be 3'
          : isMaxLengthError
            ? 'The maximum number of characters must be 30'
            : 'Please use only Latin letters, digits, spaces and hyphens';
    } else {
      result = this.error || 'Name is invalid';

      if (result.toLowerCase().includes('server error')) {
        result = 'Server error. Try again later'
      }
    }

    return result;
  }

  public isNameError(): boolean {
    return (this.submitted && this.organizationName.invalid) ||
      (this.error && this.error !== 'Domain already exists');
  }

  public isDomainError(): boolean {
    return (this.submitted && this.organizationDomain.invalid) ||
      (this.error && this.error === 'Domain already exists');
  }

  getDomainError() {
    let result = '';

    const isFrontValidationFailed = this.organizationDomain.invalid;
    const isRequired = this.organizationDomain.hasError('required');
    const isUsed = this.organizationDomain.hasError('domainUsed');

    if (isFrontValidationFailed) {
      result = isRequired
        ? 'Domain is required'
        : isUsed
          ? 'Domain already exists'
          : 'Domain is invalid';
    } else {
      result = this.error || 'Domain is invalid';
    }

    return result;
  }

  private getFormattedDomainName(name: string): string {
    let formattedName = name.trim().toLowerCase();
    formattedName = formattedName.replace(/\s/g, '-').replace('--', '-');

    const isFirstDash = formattedName[0] === '-';
    const isLastDash = formattedName[formattedName.length - 1] === '-';

    if (isFirstDash) {
      formattedName = formattedName.slice(1);
    }

    if (isLastDash) {
      formattedName = formattedName.slice(0, formattedName.length - 1);
    }

    const hasRestrictedDashes = formattedName.includes('--') || formattedName[formattedName.length - 1] === '-';

    if (hasRestrictedDashes) {
      formattedName = this.getFormattedDomainName(formattedName);
    }

    return formattedName;
  }

  private hideBanner(): void {
    this.banner = document.querySelector('ai-notifications-warning');

    if (this.banner && !this.isBannerHidden) {
      this.banner.style.display = 'none';
      this.isBannerHidden = true;
    }
  }
}
