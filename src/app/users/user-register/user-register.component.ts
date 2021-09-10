import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { EmailValidators, PasswordValidators, UniversalValidators } from 'ng2-validators';
import { UsersService, User } from './../shared';
import { AuthService, Cookie } from '@aitheon/core-client';
import * as moment from 'moment';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { QuestionTarget } from '../../shared/questions/shared/question';
import { Service, SERVICE_IGNORE_LIST } from '../../services/shared/service';
import { ServicesService } from '../../services/shared';
import { map } from 'rxjs/operators';
import { UserTypeService } from '../../admin/admin-user-types/shared/user-types.service';
import { UserType } from '../../admin/admin-user-types/shared/user-type';
import { ToastrService } from 'ngx-toastr';

declare global {
  interface Window  {
    dataLayer: any;
  }
}

@Component({
  selector: 'fl-user-register',
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.scss']
})
export class UserRegisterComponent implements OnInit, OnDestroy {
  @ViewChild('questionsTemplate') questionsRef: TemplateRef<any>;

  userForm: FormGroup;
  submitted = false;
  loading = false;
  referralCodeVisible = false;
  error: any;
  modalRef: BsModalRef;
  questionTarget: QuestionTarget = QuestionTarget.USER;
  allServices: Service[];
  enabledServices: string[] = [];
  nameMask = /^[a-zA-Z]+(?:['\s-][a-zA-Z]+)*$/;
  referralError: string;
  userEmailError: string;
  isUserExists = false;
  years: Array<number> = [];
  showForm = true;
  emailMask = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,4}))$/;
  mask = [/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/];
  returnUrl: string;
  loaded = false;
  timeLeft = 5;
  interval: any;
  userTypes: UserType[];
  isExternal: any;
  existError = false;
  existErrMessage: string;
  invalidInputs: any[] = [];
  isMinLengthRuleSatisfied: boolean = false;
  isCaseRuleSatisfied: boolean = false;
  isDigitRuleSatisfied: boolean = false;

  public validationState: any = {
    firstName: {
      valid: true,
      message: ''
    },
    lastName: {
      valid: true,
      message: ''
    },
    email: {
      valid: true,
      message: ''
    },
    password: {
      valid: true,
      message: ''
    },
    confirmPassword: {
      valid: true,
      message: ''
    },
    termsAgree: {
      valid: true,
      message: ''
    },
  };
  private fieldNames = {
    firstName: 'profile.firstName',
    lastName: 'profile.lastName',
    email: 'email',
    password: 'password',
    confirmPassword: 'confirmPassword'
  };

  get passwordField(): AbstractControl {
    return this.userForm.get('password');
  }

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService,
    private activatedRoute: ActivatedRoute,
    private modalService: BsModalService,
    private serviceService: ServicesService,
    private userTypeService: UserTypeService
  ) {
    this.authService.loggedIn.subscribe((loggedIn: boolean) => {
      if (loggedIn && !this.loaded) {
        const params = this.parseHash();
        this.returnUrl = params['returnUrl'];
        if (this.returnUrl) {
          window.location.href = this.returnUrl;
          return;
        }
        window.location.href = '/users/dashboard';
      }
      this.loaded = true;
    });
  }

  parseHash() {
    const hash = window.location.hash.substring(1);
    const params = {};
    hash.split('&').map(hk => {
      const temp = hk.split('=');
      params[temp[0]] = temp[1];
    });
    return params;
  }

  ngOnInit() {
    this.isExternal = this.activatedRoute.snapshot.params['isExternal'];
    const signupService = this.activatedRoute.snapshot.queryParams['setupService'];
    if (signupService) {
      localStorage.setItem('signup-service', signupService);
    }
    const year = moment.utc().year();
    for (let index = 0; index < 111; index++) {
      this.years.push(year - index);
    }
    this.buildForm();
    document.body.className += ' pattern-page';

    const params = this.parseHash();
    const referralCode = params['referral'] || '';
    const inviteEmail = params['inviteEmail'] ? decodeURIComponent(params['inviteEmail']) : '';
    this.returnUrl = params['returnUrl'] ? decodeURIComponent(params['returnUrl']) : '';
    if (referralCode) {
      this.userForm.get('referralCode').setValue(referralCode);
      this.showReferralCode();
    }
    if (inviteEmail) {
      this.userForm.get('email').setValue(inviteEmail);
    }

    this.serviceService.listPersonal()
      .pipe(map(services => services.filter(s => !SERVICE_IGNORE_LIST.includes(s._id)).sort(s => s.core ? 1 : -1)))
      .subscribe(services => {
        this.allServices = services;
      }, err => this.handleError(err));


    this.userTypeService.list().subscribe(userTypes => {
      this.userTypes = userTypes;
    }, err => this.handleError(err));

    this.onFormChange();
  }

  onFormChange() {
    this.userForm.get('email').valueChanges.subscribe(val => {
      const isWhitespaces = /\s/.test(val);

      if (isWhitespaces) {
        this.userForm.get('email').setValue(val.replace(/\s/g, ''));
      }

      this.resetErrorState('email');
    });

    this.userForm.get('profile.firstName').valueChanges.subscribe(val => {
      this.resetErrorState('firstName');
    });

    this.userForm.get('profile.lastName').valueChanges.subscribe(val => {
      this.resetErrorState('lastName');
    });

    this.userForm.get('password').valueChanges.subscribe(val => {
      const isWhitespaces = /\s/.test(val);

      if (isWhitespaces) {
        this.userForm.get('password').setValue(val.replace(/\s/g, ''));
      }

      this.resetErrorState('password');

      this.validatePassword();

      this.updateConfirmPassword();
    });

    this.userForm.get('confirmPassword').valueChanges.subscribe(val => {
      const isWhitespaces = /\s/.test(val);

      if (isWhitespaces) {
        this.userForm.get('confirmPassword').setValue(val.replace(/\s/g, ''));
      }

      this.resetErrorState('confirmPassword');
    });
  }

  ngOnDestroy(): void {
    document.body.className = '';
  }

  openModal() {
    this.modalRef = this.modalService.show(this.questionsRef, { ignoreBackdropClick: true });
  }

  buildForm(): void {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.pattern(this.emailMask), EmailValidators.normal]],
      profile: this.fb.group({
        firstName: ['', Validators.compose([
          Validators.required,
          UniversalValidators.minLength(2),
          UniversalValidators.maxLength(50),
          Validators.pattern(this.nameMask)])],
        lastName: ['', Validators.compose([
          Validators.required,
          UniversalValidators.minLength(2),
          UniversalValidators.maxLength(50),
          Validators.pattern(this.nameMask)
        ])]
      }),
      password: ['', Validators.compose([
        Validators.required,
        PasswordValidators.alphabeticalCharacterRule(1),
        PasswordValidators.digitCharacterRule(1),
        PasswordValidators.lowercaseCharacterRule(1),
        PasswordValidators.uppercaseCharacterRule(1),
        UniversalValidators.minLength(8),
        UniversalValidators.maxLength(64),
        UniversalValidators.noWhitespace
      ])],
      confirmPassword: ['', Validators.required],
      referralCode: [''],
      accountType: 'personal',
      type: ['REGULAR'],
      termsAgree: [false, Validators.requiredTrue]
    });

    this.userForm.setValidators(PasswordValidators.mismatchedPasswords('password', 'confirmPassword'));
  }

  // on continue
  onSubmit(): void {
    this.submitted = true;

    this.validateForm();

    if (!this.userForm.valid) {
      this.showError();

      return;
    }

    const value = this.userForm.value;
    this.showForm = false;
    value.email = value.email.toLowerCase();

    return this.signup(value);
  }

  signup(user: User): void {
    this.loading = true;
    this.usersService.signup(user).subscribe((u: User) => {
      // For Google Analytics
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        'event': 'signupComplete'
      });
      window.location.hash = '';
      this.submitted = false;
      this.showForm = false;

      this.processUTMTracker(u._id);

      this.authService.login(user.email, user.password).subscribe((result: any) => {
        this.authService.init();
        // for external suppiler
        if (this.isExternal) {
          this.usersService.processOnBoarding([], ['BUSINESS']).subscribe((resp) => {
            location.href = `/users/organizations/setup/${this.isExternal}`;
          }, (err) => {
            this.toastr.error('User onbaording Error:', err ? err : '');
          });

        } else {
          window.location.href = '/users/user/onboarding';
        }
      });
    }, (error) => {
      this.loading = false;
      this.existError = true;
      this.showForm = true;
      this.existErrMessage = this.handleError(error);
      this.toastr.error(this.existErrMessage);
    });
  }

  handleError(error: any) {
    this.error = error;
    return this.error;
  }

  showReferralCode() {
    this.referralCodeVisible = true;
  }

  togglePass() {
    const passEye = document.getElementsByClassName('password-eye')[0],
      passInput: any = document.querySelector('.form-control__password-input');

    if (passInput.type === 'password') {
      passEye.classList.add('show');
      passInput.type = 'text';
    } else {
      passEye.classList.remove('show');
      passInput.type = 'password';
    }
  }

  get isFormFilled(): boolean {
    const value = this.userForm.value;
    let isFilled = true;

    Object.keys(value).forEach((key, i) => {
      if (!value[key] && key !== 'referralCode') {
        isFilled = false;
      }
    });

    Object.keys(value.profile).forEach((key, i) => {
      if (!value.profile[key]) {
        isFilled = false;
      }
    });

    return isFilled;
  }

  public preventCopy(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  private getFirstNameError() {
    let result = '';

    const name = this.userForm.get('profile.firstName').value;

    if (name == '-') {
      result = 'First Name is invalid';
    } else if (this.userForm.get('profile.firstName').hasError('minLength')) {
      result = 'First Name should contain at least 2 characters';
    } else if (this.userForm.get('profile.firstName').hasError('maxLength')) {
      result = 'First name cannot be more than 50 characters';
    } else if (this.userForm.get('profile.firstName').hasError('required')) {
      result = 'First Name field is required';
    } else if (this.userForm.get('profile.firstName').hasError('pattern')) {
      result = 'First Name is invalid';
    }

    return result;
  }

  private getLastNameError() {
    let result = '';

    const name = this.userForm.get('profile.lastName').value;

    if (name == '-') {
      result = 'Last Name is invalid';
    } else if (this.userForm.get('profile.lastName').hasError('minLength')) {
      result = 'Last Name should contain at least 2 characters';
    } else if (this.userForm.get('profile.lastName').hasError('maxLength')) {
      result = 'First name cannot be more than 50 characters';
    } else if (this.userForm.get('profile.lastName').hasError('required')) {
      result = 'Last Name field is required';
    } else if (this.userForm.get('profile.lastName').hasError('pattern')) {
      result = 'Last Name is invalid';
    }

    return result;
  }

  private getEmailError() {
    let result = '';

    if (this.userForm.get('email').hasError('required')) {
      result = 'Email is required';
    } else if (this.userForm.get('email').invalid) {
      result = 'Email is invalid';
    } else if (this.existError) {
      result = 'This email already exists';
    }

    return result;
  }

  private getPasswordError() {
    let result = '';
    let password = this.userForm.get('password');

    if (password.hasError('required')) {
      result = 'Password is required';
    } else {
      result = 'Please enter valid password';
    }

    return result;
  }

  private getConfirmPasswordError() {
    let result = '';

    if (this.userForm.get('confirmPassword').invalid) {
      result = 'Passwords do not match';
    }

    return result;
  }

  private resetErrorState(fieldName): void {
    this.validationState[fieldName].valid = true;
    this.validationState[fieldName].message = '';

    if (!!this.submitted) {
      this.submitted = false;
    }
  }

  selectUserType(userType: string) {
    this.userForm.get('type').setValue(userType.toUpperCase());
  }

  toggleCheckbox() {
    const checkbox = <HTMLInputElement>document.getElementById('checkbox-1');
    checkbox.checked = !checkbox.checked;
  }

  processUTMTracker(userId: string) {
    const campaign = Cookie.get('campaigny');
    const medium = Cookie.get('mediumy');
    const source = Cookie.get('sourcey');
    const term = Cookie.get('termy');
    const content = Cookie.get('contenty');
    const referral = Cookie.get('referraly');

    const signActivity = {
      user: userId,
      type: 'SIGN_UP',
      data: {
        utm: {
          campaign,
          medium,
          source,
          term,
          content
        },
        referral
      }
    };
    this.usersService.createActivity(signActivity).subscribe();
  }

  private validateForm(): void {
    let fieldNamesToValidate = Object.keys(this.fieldNames);

    this.invalidInputs = [];

    fieldNamesToValidate.filter(fieldName => {
      const isNameInvalid = this.isInputInvalid(fieldName);

      if (isNameInvalid) {
        let inputErrorInfo = {
          name: fieldName,
          valid: false
        };

        this.invalidInputs.push(inputErrorInfo);
      }
    });
  }

  private validatePassword(): void {
    let passwordField = this.passwordField;
    const isFilled = !passwordField.hasError('required');
    const isLengthValid = !passwordField.hasError('minLength') &&
      !passwordField.hasError('maxLength');
    const isCaseValid = !passwordField.hasError('lowercaseCharacterRule') &&
      !passwordField.hasError('uppercaseCharacterRule');
    const isDigitValid = !passwordField.hasError('digitCharacterRule');

    this.isMinLengthRuleSatisfied = isFilled && isLengthValid;
    this.isCaseRuleSatisfied = isFilled && isCaseValid;
    this.isDigitRuleSatisfied = isFilled && isDigitValid;
  }

  public isTermsAgreeChecked(): boolean {
    return !!this.userForm.get('termsAgree').value;
  }

  private showError(): void {
    if (this.invalidInputs.length > 0) {
      const firstFieldWithError = this.invalidInputs[0];
      const invalidFieldName = firstFieldWithError.name;
      const errorMessage = this.getErrorMessage(invalidFieldName);

      this.validationState[invalidFieldName].valid = false;
      this.validationState[invalidFieldName].message = errorMessage;
    }
  }

  private getErrorMessage(fieldName): string {
    let errorMessage = '';

    switch (fieldName) {
      case 'firstName':
        errorMessage = this.getFirstNameError();
        break;
      case 'lastName':
        errorMessage = this.getLastNameError();
        break;
      case 'email':
        errorMessage = this.getEmailError();
        break;
      case 'password':
        errorMessage = this.getPasswordError();
        break;
      case 'confirmPassword':
        errorMessage = this.getConfirmPasswordError();
        break;
      default:
        errorMessage = 'Please enter valid values';
    }

    return errorMessage;
  }

  public isInputInvalid(fieldName): boolean {
    return this.userForm.get(this.fieldNames[fieldName]).invalid;
  }

  private updateConfirmPassword(): void {
    let confirmPasswordField = this.userForm.get('confirmPassword');
    const confirmPasswordValue = confirmPasswordField.value;

    if (confirmPasswordValue.length) {
      confirmPasswordField.patchValue(confirmPasswordValue);
    }
  }
}
