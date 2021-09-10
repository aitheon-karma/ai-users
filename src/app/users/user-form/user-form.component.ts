import { ToastrService } from 'ngx-toastr';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  ViewChild,
  TemplateRef,
  SimpleChanges
} from '@angular/core';
import { FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { User, UsersService } from './../shared';
import { Team } from './../../teams/shared';
import { Service } from './../../services/shared/service';
import { FileItem, FileUploader } from 'ng2-file-upload';
import { AuthService } from '@aitheon/core-client';
import * as moment from 'moment';
import { SecondFactorModalComponent } from '../second-factor-modal/second-factor-modal.component';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';

enum UserFormTabState {
  GENERAL = 1,
  PERSONAL = 2,
  PROFESSIONAL = 3,
  DATING = 4
}

@Component({
  selector: 'fl-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.scss']
})
export class UserFormComponent implements OnInit, OnChanges, OnDestroy {
  @Input() personal = false;
  @Input() searchView = false;
  @Input() foundUser = false;
  @Input() isEdit = true;
  @Input() user: any;
  @Input() teams: Team[];
  @Input() services: Service[];
  @Input() organizationId: string;
  @Input() isUpdating: boolean;

  @Output() canceled: EventEmitter<any> = new EventEmitter<any>();
  @Output() saved: EventEmitter<User> = new EventEmitter<User>();
  @Output() backToSearch: EventEmitter<any> = new EventEmitter<any>();
  @Output() isFormChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() emailConfirmationClicked: EventEmitter<boolean> = new EventEmitter<boolean>();

  @ViewChild('secondFactorModal') secondFactorModal: SecondFactorModalComponent;

  submitted = false;
  loading = false;
  userForm: FormGroup;
  kycModalRef: BsModalRef;
  error: any;
  roles: Array<{ id: string, text: string }>;
  orgServicesRoles: Array<{ service: string, role: string }>;

  genders = ['Male', 'Female'];
  emailMask = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,4}))$/;
  nameMask = /^[a-zA-Z]+(?:['\s-][a-zA-Z]+)*$/;

  baseUrl: string;
  uploader: FileUploader;
  hasBaseDropZoneOver = false;
  authToken: string;
  uploadingAvatar = false;
  years: Array<number> = [];

  tabState = UserFormTabState.GENERAL;
  countries: any;
  currentStates: Array<string>;
  homeStates: Array<string>;
  languageList: any[] = [];
  kycStatusMessage = '';
  notVerifiedMessage = '(Not Confirmed)';
  emailVerificationInterval: any = null;
  secondsToRestartEmailVerification = 0;
  validationState: any = {};

  private initialFormValue: any = {};
  private isComponentInitialized = false;
  private FIELD_NAMES = {
    firstName: 'profile.firstName',
    lastName: 'profile.lastName',
    email: 'profile.email',
    phoneNumber: 'profile.phoneNumber',
    gender: 'profile.gender',
    birthday: 'profile.birthday',
    intro: 'personal.intro',
    coverImageUrl: 'personal.coverImageUrl'
  };
  private phoneMask = /^\s*(?:\+?(\d{1,3}))?[-. (]*(\d{3})[-. )]*(\d{3})[-. ]*(\d{4})(?: *x(\d+))?\s*$/;
  private subscriptions$: Subscription = new Subscription();
  private isSecondFactorOpen: boolean = false;

  get isNew() {
    return this.user && !this.user._id;
  }

  get activeRole() {
    const val = this.userForm.get('organizationRole.role').value;
    return [{ id: val, text: val }];
  }

  get activeTeams() {
    const teams = this.userForm.get('organizationRole.teams').value as string[];
    return this.teams.filter((t: Team) => teams.includes(t._id));
  }

  get firstName(): AbstractControl {
    return this.userForm.get(this.FIELD_NAMES.firstName);
  }

  get lastName(): AbstractControl {
    return this.userForm.get(this.FIELD_NAMES.lastName);
  }

  get phoneNumber(): AbstractControl {
    return this.userForm.get(this.FIELD_NAMES.phoneNumber);
  }

  get email(): AbstractControl {
    return this.userForm.get(this.FIELD_NAMES.email);
  }

  get birthday(): AbstractControl {
    return this.userForm.get(this.FIELD_NAMES.birthday);
  }

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private modalService: BsModalService,
    private authService: AuthService,
    private usersService: UsersService) {
    this.authService.token.subscribe((token: string) => {
      this.authToken = token;
    });
  }

  ngOnInit() {
    if (this.user) {
      this.populateCountries();
      this.populateLanguages();
      this.buildForm(this.user);
      this.updateKycStatus();
    } else {
      this.userForm = null;
    }

    this.roles = [{ id: 'SuperAdmin', text: 'SuperAdmin' }, { id: 'OrgAdmin', text: 'OrgAdmin' }, {
      id: 'User',
      text: 'User'
    }];

    const xBase = (document.getElementsByTagName('base')[0] || { href: '/' }).href;
    const url = `${this.stripTrailingSlash(xBase)}/api/users/profile/avatar`;
    const year = moment.utc().year();

    for (let index = 0; index < 111; index++) {
      this.years.push(year - index);
    }
    this.initUploader(url);

    this.watchSecondFactorModal();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.user && !this.isComponentInitialized) {
      this.populateCountries();
      this.populateLanguages();
      this.buildForm(this.user);

      this.isComponentInitialized = true;
    }

    if (changes.isUpdating.currentValue) {
      this.onSubmit();
    }
  }

  ngOnDestroy() {
    this.subscriptions$.unsubscribe();
  }

  buildForm(user: User): void {
    const userForm = this.fb.group({
      profile: this.fb.group({
        firstName: [
          user.profile.firstName,
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
            Validators.pattern(this.nameMask)
          ]
        ],
        lastName: [
          user.profile.lastName,
          [
            Validators.required,
            Validators.minLength(2),
            Validators.maxLength(50),
            Validators.pattern(this.nameMask)
          ]
        ],
        email: [user.email, [
          Validators.required,
          Validators.email,
          Validators.pattern(this.emailMask)
        ]
        ],
        phoneNumber: [user.profile.phoneNumber || ''],
        gender: [user.profile.gender === undefined ? '' : user.profile.gender],
        birthday: [moment(user.profile.birthday).format('DD.MM.YYYY') || ''],
        currentAddress: this.fb.group({
          addressLine1: [(user.profile.currentAddress === undefined ? '' : user.profile.currentAddress.addressLine1)],
          addressLine2: [(user.profile.currentAddress === undefined ? '' : user.profile.currentAddress.addressLine2)],
          city: [(user.profile.currentAddress === undefined ? '' : user.profile.currentAddress.city), Validators.pattern('^([a-zA-Z\u0080-\u024F]+(?:. |-| |\'))*[a-zA-Z\u0080-\u024F]*$')],
          regionState: [(user.profile.currentAddress === undefined ? '' : user.profile.currentAddress.regionState)],
          country: [(user.profile.currentAddress === undefined ? '' : user.profile.currentAddress.country)],
          code: [
            (user.profile.currentAddress === undefined ? '' : user.profile.currentAddress.code),
            [Validators.pattern('^[a-zA-Z0-9-]*$'), Validators.minLength(4), Validators.maxLength(10)]
          ]
        }),
      }),
      personal: this.fb.group({
        intro: [(user.personal === undefined ? '' : user.personal.intro)],
        coverImageUrl: [(user.personal === undefined ? '' : user.personal.coverImageUrl)],
      }),
    });

    this.userForm = userForm;
    this.initialFormValue = JSON.stringify(userForm.value);

    this.initValidationState();
    this.setFormListeners();
  }

  onSubmit(): void {
    this.submitted = true;

    this.validateForm();

    const isFormInvalid = this.isFormInvalid();

    if (isFormInvalid) {
      this.cancel();
      return;
    }

    const value = this.userForm.value;

    this.userForm.enable();

    value.profile.email = value.profile.email.toLowerCase();
    value.profile.firstName = value.profile.firstName.replace(/^\w/, (c: string) => c.toUpperCase());
    value.profile.lastName = value.profile.lastName.replace(/^\w/, (c: string) => c.toUpperCase());

    const user = Object.assign({}, this.user, value);
    user.isNewUser = true;
    user.email = value.profile.email;

    const birthday = moment(value.profile.birthday, 'DD.MM.YYYY');

    value.profile.birthday = birthday;

    value.profile.avatarUrl = this.user.profile.avatarUrl;

    if (this.user.personal !== undefined) {
      value.personal.coverImageUrl = this.user.personal.coverImageUrl;
    } else if (this.user.professional !== undefined) {
      value.professional.coverImageUrl = this.user.professional.coverImageUrl;
    } else if (this.user.dating !== undefined) {
      value.dating.coverImageUrl = this.user.dating.coverImageUrl;
    }

    if (!this.personal) {
      user.organizationRole.services = this.orgServicesRoles;
    }

    if (this.searchView && !this.isEdit) {
      this.loading = true;
      this.invite(user);
    } else {
      if (this.personal) {
        if (this.user.email.toLowerCase() !== user.email.toLowerCase()) {
          this.isSecondFactorOpen = true;
          this.error = '';
          return this.secondFactorModal.request(user);
        }
      }
      this.loading = true;

      this.update(user, '');
    }
  }

  secondFactorSuccess(event: { data: any, otpCode: string }) {
    this.loading = true;
    this.error = '';
    this.update(event.data, event.otpCode);
  }

  invite(user: User): void {
    this.subscriptions$.add(
      this.usersService.inviteToOrganization(this.organizationId, user).subscribe((u: User) => {
        Object.assign(this.user, u);
        this.submitted = false;
        this.loading = false;
        this.saved.emit(u);
        this.toastr.success('User invited');
      }, (error) => this.handleError(error))
    );
  }

  update(user: User, otpCode: string): void {
    this.subscriptions$.add(
      this.usersService.update(this.organizationId, user, this.personal, otpCode)
        .subscribe((u: User) => {
          this.hideModal();
          this.submitted = false;
          this.loading = false;
          this.saved.emit(u);
          this.toastr.success('Saved');
          this.isFormChanged.emit(false);
        }, (error) => {
          if (error && error === 'Email already exists') {
            this.setError('email', error);
            this.submitted = false;
            this.loading = false;
            this.hideModal();
            this.cancel();

            return;
          }

          this.handleError(error);
        })
    );
  }

  handleError(error: any) {
    this.error = error;
    this.loading = false;
    this.submitted = false;

    if (this.error && this.error.indexOf('Invalid verification code') !== -1) {
      this.error = 'Incorrect code. Try again.';

      return;
    }

    if (this.error?.length) {
      this.secondFactorModal.hideModal();
      this.toastr.error(this.error);
    }
  }

  cancel(): void {
    this.canceled.emit();
  }

  roleChange(value: { id: string, text: string }) {
    this.userForm.get('organizationRole.role').setValue(value.id);
  }

  back() {
    this.backToSearch.emit();
  }

  initUploader(baseUrl: string): void {
    this.uploader = new FileUploader({
      url: baseUrl,
      method: 'POST',
      authToken: 'JWT ' + this.authToken,
      autoUpload: true,
      // allowedFileType: ['images']
    });

    /**
     * Events
     */
    this.uploader.onBeforeUploadItem = () => {
      this.uploadingAvatar = true;
    };
    this.uploader.onSuccessItem = (fileItem: FileItem, response: any) => {
      const res = JSON.parse(response);

      this.uploadingAvatar = false;
      response = JSON.parse(response);
      // this.user = _.extend(this.user, );
      this.user.profile.avatarUrl = response.profile.avatarUrl;
      this.user.updatedAt = response.updatedAt;
      this.authService.refreshAvatar(res);

    };

    this.uploader.onErrorItem = (fileItem: FileItem, response: any, status: any) => {
      this.uploadingAvatar = false;
      try {
        response = JSON.parse(response);
        response = response.message;
      } catch (err) {
      }
      fileItem.remove();
      this.toastr.error(`${fileItem.file.name} ${response} `, `Upload error (${status}) `);
    };
  }

  fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  switchTab(tabIndex: number) {
    this.tabState = tabIndex;
  }

  populateLanguages(): void {
    this.languageList.push('English');
    this.languageList.push('Arabic');
  }

  populateCountries(): void {
    this.subscriptions$.add(
      this.usersService.countriesList().subscribe((cl: any) => {
        this.countries = cl.countries;
        if (this.user.profile.currentAddress !== undefined) {
          this.populateCurrentState(this.user.profile.currentAddress.country);
        }
        if (this.user.profile.homeAddress !== undefined) {
          this.populateHomeState(this.user.profile.homeAddress.country);
        }
      }, (error) => {
        this.handleError(error);
      })
    );
  }

  currentCountryChange() {
    const selectedCountry = this.userForm.get('profile.currentAddress.country').value;
    this.populateCurrentState(selectedCountry);
  }

  homeCountryChange() {
    const selectedCountry = this.userForm.get('profile.homeAddress.country').value;
    this.populateHomeState(selectedCountry);
  }

  populateCurrentState(selectedCountry: any) {

    if (selectedCountry !== undefined && selectedCountry) {
      const country = this.countries.filter(c => c.country === selectedCountry);
      this.currentStates = country[0].states;
      this.userForm.get('profile.currentAddress.regionState').patchValue([]);
    }
  }

  populateHomeState(selectedCountry: any) {
    this.homeStates = [];
    if (selectedCountry !== undefined && selectedCountry) {
      const country = this.countries.filter(c => c.country === selectedCountry);
      this.homeStates = country[0].states;
    }
  }

  verifyUser(kycRef: TemplateRef<any>): void {
    try {
      const webClient: HTMLElement = document.querySelector('ai-web-client');
      webClient.style.zIndex = '4000';
    } catch (err) {
      console.warn('could not set webclient z-index');
    }

    this.kycModalRef = this.modalService.show(kycRef, { class: 'modal-lg' });
  }

  closeKYCModal(): void {
    this.kycModalRef.hide();
    this.updateKycStatus();
  }

  public resendConfirmation(event): void {
    if (this.emailVerificationInterval) {
      this.preventDefault(event);
    } else {
      this.emailConfirmationClicked.emit(true);

      this.secondsToRestartEmailVerification = 20;

      this.emailVerificationInterval = setInterval(() => {
        if (this.secondsToRestartEmailVerification > 0) {
          this.secondsToRestartEmailVerification--;
        } else {
          clearInterval(this.emailVerificationInterval);
          this.emailVerificationInterval = null;
        }
      }, 1000);
    }
  }

  public getKycStatusClass(): string {
    const kycStatus: any = this.user.KYCStatus;
    let kycClass = '';

    if (kycStatus === 'VERIFY_FINISHED') {
      kycClass = 'user-form__kyc-status--success';
    } else if (kycStatus === 'PENDING') {
      kycClass = 'user-form__kyc-status--process';
    } else {
      kycClass = 'user-form__kyc-status--fail';
    }

    return kycClass;
  }

  private stripTrailingSlash = (str) => {
    return str.endsWith('/') ? str.slice(0, -1) : str;
  }

  private setFormListeners(): void {
    this.subscriptions$.add(
      this.userForm.valueChanges.subscribe(value => {
        const newState = JSON.stringify(value);

        if (newState !== this.initialFormValue) {
          this.isFormChanged.emit(true);
        } else {
          this.isFormChanged.emit(false);
        }

        this.submitted = false;
      })
    );
  }

  private preventDefault(event: any): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private updateKycStatus(): void {
    this.kycStatusMessage = this.getKycStatusMessage(this.user.KYCStatus);
  }

  private getKycStatusMessage(status: any): string {
    let kycStatusMessage = '';

    if (status === 'VERIFY_FINISHED') {
      kycStatusMessage = 'Documents verified';
    } else if (status === 'PENDING') {
      kycStatusMessage = 'Documents on verification';
    } else if (status === 'DENIED_IMAGE') {
      kycStatusMessage = 'Images denied. Please, provide new';
    } else {
      kycStatusMessage = 'Documents not verified';
    }

    return kycStatusMessage;
  }

  private initValidationState(): void {
    Object.entries(this.userForm.controls).forEach(control => this.addValidationStateItems(...control));
  }

  private addValidationStateItems(formGroupName: string, formGroup: any): void {
    const hasNestedControls = formGroup.controls;

    if (hasNestedControls) {
      let controls = Object.entries(formGroup.controls).forEach(control => this.addValidationStateItems(...control));
    } else {
      this.validationState[formGroupName] = {
        isValid: true,
        message: ''
      };
    }
  }

  private validateForm() {
    let fieldNames = Object.keys(this.FIELD_NAMES);

    fieldNames.forEach(fieldName => {
      let control = this.userForm.get(this.FIELD_NAMES[fieldName]);

      if (control.invalid) {
        this.validationState[fieldName].isValid = false;
        this.validationState[fieldName].message = this.getErrorMessage(fieldName);
      }
    });

    this.validatePhoneNumber();
    this.validateBirthDate();
  }

  private getErrorMessage(fieldName: string): string {
    const isName = fieldName === 'firstName' || fieldName === 'lastName';
    const isEmail = fieldName === 'email';
    let control = this[fieldName];
    let errorMessage = '';

    if (isName) {
      errorMessage = this.getNameErrorMessage(control, fieldName);
    } else if (isEmail) {
      errorMessage = this.getEmailErrorMessage(control);
    } else {
      errorMessage = 'Incorrect value';
    }

    return errorMessage;
  }

  private getNameErrorMessage(control: AbstractControl, fieldName: string): string {
    const name = fieldName === 'firstName' ? 'First name' : 'Last name';
    let errorMessage = '';

    if (control.hasError('required')) {
      errorMessage = `${name} is required`;
    } else if (control.hasError('minlength')) {
      errorMessage = `${name} should contain at least 2 characters`;
    } else if (control.hasError('maxlength')) {
      errorMessage = `${name} cannot be more than 50 characters`;
    } else if (control.hasError('pattern')) {
      errorMessage = `${name} is invalid`;
    }

    return errorMessage;
  }

  private getEmailErrorMessage(control: AbstractControl): string {
    return 'Email is invalid';
  }

  private resetErrorState(fieldName: string): void {
    this.validationState[fieldName].isValid = true;
    this.validationState[fieldName].message = '';
  }

  private setError(fieldName: string, errorMessage: string): void {
    this.validationState[fieldName].isValid = false;
    this.validationState[fieldName].message = errorMessage;
  }

  private validatePhoneNumber(): void {
    const phoneValue = this.phoneNumber.value;

    if (phoneValue && !phoneValue.match(this.phoneMask)) {
      this.setError('phoneNumber', 'Invalid phone number');
    }
  }

  private validateBirthDate(): void {
    const birthDate = this.birthday.value;
    const enteredDate = moment(birthDate, 'DD.MM.YYYY');
    const currentDate = moment(moment(new Date()).format('DD.MM.YYYY'), 'DD.MM.YYYY');

    if (currentDate.diff(enteredDate) < 0) {
      this.setError('birthday', 'Invalid birth date');
    }
  }

  private isFormInvalid(): boolean {
    return Object.entries(this.validationState).some((controlInfo: Array<any>) => {
      return !controlInfo[1].isValid;
    });
  }

  private hideModal(): void {
    if (this.secondFactorModal.isOpened) {
      this.secondFactorModal.hideModal();
    }
  }

  private watchSecondFactorModal(): void {
    this.subscriptions$.add(
      this.modalService.onHide
        .subscribe((reason: any) => {
          if (reason === 'backdrop-click' && this.isSecondFactorOpen) {
            this.isSecondFactorOpen = false;
            this.cancel();
          }
        })
    )
  }
}
