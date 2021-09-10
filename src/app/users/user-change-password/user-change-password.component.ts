import { ToastrService } from 'ngx-toastr';
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, Validators, FormGroup, AbstractControl } from '@angular/forms';
import { PasswordValidators, UniversalValidators } from 'ng2-validators';
import { UsersService, User } from './../shared';
import { AuthService } from '@aitheon/core-client';
import { SecondFactorModalComponent } from '../second-factor-modal/second-factor-modal.component';

@Component({
  selector: 'fl-user-change-password',
  templateUrl: './user-change-password.component.html',
  styleUrls: ['./user-change-password.component.scss']
})
export class UserChangePasswordComponent implements OnInit, AfterViewInit {
  passwordForm: FormGroup;
  submitted = false;
  loading = false;
  error: any;

  public isMinLengthRuleSatisfied: boolean = false;
  public isCaseRuleSatisfied: boolean = false;
  public isDigitRuleSatisfied: boolean = false;
  public isCurrentPasswordValid: boolean = true;
  public isNewPasswordValid: boolean = true;
  public isConfirmPasswordValid: boolean = true;
  public isButtonEnabled: boolean = true;
  public currentPasswordErrorMessage: string = '';
  public newPasswordErrorMessage: string = '';
  public confirmPasswordErrorMessage: string = '';
  public passwordsState: any = {
    'current-password': {
      type: 'password',
      isPristine: true
    },
    'new-password': {
      type: 'password',
      isPristine: true
    },
    'confirm-password': {
      type: 'password',
      isPristine: true
    }
  };

  private currentUser: User;

  @ViewChild('secondFactorModal') secondFactorModal: SecondFactorModalComponent;
  @ViewChild('currentPasswordInput') currentPasswordInput: ElementRef;
  @ViewChild('newPasswordInput') newPasswordInput: ElementRef;
  @ViewChild('confirmPasswordInput') confirmPasswordInput: ElementRef;

  get currentPassword(): AbstractControl {
    return this.passwordForm.get('currentPassword');
  }

  get password(): AbstractControl {
    return this.passwordForm.get('password');
  }

  get confirmPassword(): AbstractControl {
    return this.passwordForm.get('confirmPassword');
  }

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private authService: AuthService,
    private toastr: ToastrService,
  ) {
  }

  ngOnInit() {
    this.buildForm();

    this.authService.currentUser
      .subscribe((user: User) => {
        this.currentUser = user;
      });
  }

  ngAfterViewInit() {
    this.disableAutocompletes();
  }

  buildForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
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
    });

    this.passwordForm.setValidators(PasswordValidators.mismatchedPasswords('password', 'confirmPassword'));

    this.setFormListeners();
  }

  onSubmit({ value, valid }: { value: { currentPassword: string, password: string }, valid: boolean }): void {
    this.submitted = true;

    this.validateForm();

    if (!valid) {
      return;
    }

    this.error = null;
    this.currentPasswordErrorMessage = '';

    this.usersService.checkCurrentPassword({ password: value.currentPassword })
      .subscribe(
        (result: any) => {
          if (result.valid) {
            return this.secondFactorModal.request(value);
          } else {
            return this.handleError('Current password is incorrect');
          }
        },
        (error: any) => this.handleError(error)
      );
  }

  secondFactorSuccess(event: { data: any, otpCode: string }) {
    this.changeAction(event.data, event.otpCode || '');

    this.validatePassword();
  }

  changeAction(value: any, otpCode: string) {
    this.loading = true;
    this.error = null;

    this.usersService.changePassword(value, otpCode).subscribe(() => {
      if (this.secondFactorModal.isOpened) {
        this.secondFactorModal.hideModal();
      }
      this.toastr.success('Your password changed');
      this.resetForm();
      this.submitted = false;
      this.loading = false;
    }, (err: any) => this.handleError(err));
  }

  handleError(error: any) {
    this.error = error;

    if (this.error && (this.error === 'Current password is incorrect')) {
      if (this.secondFactorModal.isOpened) {
        this.secondFactorModal.hideModal();
      }
      this.currentPasswordErrorMessage = this.error;
    }

    if (this.error && this.error.indexOf('Invalid verification code') !== -1) {
      this.secondFactorModal.resetForm();
      this.error = 'Incorrect code. Try again.';
    }

    this.submitted = false;
    this.loading = false;
  }

  confirmPasswordError() {
    let result = '';

    if (this.submitted) {
      if (this.passwordForm.get('confirmPassword').hasError('mismatchedPasswords')) {
        result = 'Mismatched passwords';
      } else if (this.passwordForm.get('confirmPassword').hasError('required')) {
        result = 'Confirm password is required';
      }
    }
    return result;
  }

  // breaking autofill
  public changeTypeIfEmpty(input: HTMLInputElement): void {
    if (!input.value) {
      input.setAttribute('type', 'text');
    } else {
      this.passwordsState[input.id].isEmpty = false;
    }

    input.removeAttribute('readonly');
  }

  // breaking autofill
  public setPasswordType(input: HTMLInputElement): void {
    input.setAttribute('type', this.passwordsState[input.id].type);
  }

  public togglePass(event, passwordInput) {
    const passEye = event.target;
    const passInput = passwordInput;
    const inputId = passInput.id;

    if (passInput.type === 'password' || this.passwordsState[inputId].isPristine) {
      passEye.classList.add('show');
      passInput.type = 'text';
    } else {
      passEye.classList.remove('show');
      passInput.type = 'password';
    }

    if (this.passwordsState[inputId].isPristine) {
      this.passwordsState[inputId].isPristine = false;
    }

    this.passwordsState[passInput.id].type = passInput.type;
  }

  public preventCopy(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  private getPasswordError(field) {
    let result = '';
    let password = null;

    if (field === 'currentPassword') {
      password = this.passwordForm.get('currentPassword');
    } else if (field === 'password') {
      password = this.passwordForm.get('password');
    } else {
      password = this.passwordForm.get('confirmPassword');
    }

    if (password.hasError('required')) {
      result = 'Password is required';
    } else {
      result = 'Please enter valid password';
    }

    return result;
  }

  private setFormListeners(): void {
    this.currentPassword.valueChanges.subscribe(val => {
      const isWhitespaces = /\s/.test(val);

      this.resetErrors('currentPassword');
      this.setButtonState();

      if (isWhitespaces) {
        this.passwordForm.get('currentPassword').setValue(val.replace(/\s/g, ''));
      }

      if (!val) {
        this.addReadOnlyAttribute(this.currentPasswordInput.nativeElement);

        setTimeout(() => {
          this.currentPasswordInput.nativeElement.removeAttribute('readonly');
        }, 0);
      }
    });

    this.password.valueChanges.subscribe(val => {
      const isWhitespaces = /\s/.test(val);

      this.resetErrors('password');
      this.setButtonState();

      if (isWhitespaces) {
        this.passwordForm.get('password').setValue(val.replace(/\s/g, ''));
      }

      this.newPasswordErrorMessage = '';

      this.updateConfirmPassword();
      this.validatePassword();

      if (!val) {
        this.addReadOnlyAttribute(this.newPasswordInput.nativeElement);

        setTimeout(() => {
          this.newPasswordInput.nativeElement.removeAttribute('readonly');
        }, 0);
      }
    });

    this.confirmPassword.valueChanges.subscribe(val => {
      const isWhitespaces = /\s/.test(val);

      this.resetErrors('confirmPassword');
      this.setButtonState();

      if (isWhitespaces) {
        this.passwordForm.get('confirmPassword').setValue(val.replace(/\s/g, ''));
      }

      this.confirmPasswordErrorMessage = '';

      if (!val) {
        this.addReadOnlyAttribute(this.confirmPasswordInput.nativeElement);

        setTimeout(() => {
          this.confirmPasswordInput.nativeElement.removeAttribute('readonly');
        }, 0);
      }
    });
  }

  private validateForm(): void {
    const isCurrentPasswordValid = this.passwordForm.get('currentPassword').valid;
    const isNewPasswordValid = this.passwordForm.get('password').valid;
    const isConfirmPasswordValid = this.passwordForm.get('confirmPassword').valid;

    if (!isCurrentPasswordValid) {
      this.isCurrentPasswordValid = isCurrentPasswordValid;
      this.currentPasswordErrorMessage = this.getPasswordError('currentPassword');

      return;
    }

    if (!isNewPasswordValid) {
      this.isNewPasswordValid = isNewPasswordValid;
      this.newPasswordErrorMessage = this.getPasswordError('password');

      return;
    }

    if (!isConfirmPasswordValid) {
      this.isConfirmPasswordValid = isConfirmPasswordValid;
      this.confirmPasswordErrorMessage = this.getPasswordError('confirmPassword');

      return;
    }

    return;
  }

  private validatePassword(): void {
    let passwordField = this.password;
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

  private resetErrors(field: string): void {
    switch (field) {
      case 'currentPassword':
        this.isCurrentPasswordValid = true;
        this.currentPasswordErrorMessage = '';
        break;
      case 'password':
        this.isNewPasswordValid = true;
        break;
      case 'confirmPassword':
        this.isConfirmPasswordValid = true;
        break;
    }
    this.submitted = false;
  }

  private setButtonState(): void {
    const isCurrentPasswordEntered = this.passwordForm.get('currentPassword').value?.length > 0;
    const isNewPasswordEntered = this.passwordForm.get('password').value?.length > 0;
    const isConfirmPasswordEntered = this.passwordForm.get('confirmPassword').value?.length > 0;

    this.isButtonEnabled = isCurrentPasswordEntered || isNewPasswordEntered || isConfirmPasswordEntered;
  }

  private updateConfirmPassword(): void {
    let confirmPasswordField = this.passwordForm.get('confirmPassword');
    const confirmPasswordValue = confirmPasswordField.value;

    if (confirmPasswordValue && confirmPasswordValue.length) {
      confirmPasswordField.patchValue(confirmPasswordValue);
    }
  }

  private resetForm(): void {
    this.passwordForm.reset();
    this.resetRules();
  }

  private resetRules(): void {
    this.submitted = false;
    this.isMinLengthRuleSatisfied = false;
    this.isCaseRuleSatisfied = false;
    this.isDigitRuleSatisfied = false;
  }

  private disableAutocompletes(): void {
    this.disableSingleAutocomplete(this.currentPasswordInput.nativeElement);
    this.disableSingleAutocomplete(this.newPasswordInput.nativeElement);
    this.disableSingleAutocomplete(this.confirmPasswordInput.nativeElement);
  }

  private disableSingleAutocomplete(input: HTMLInputElement): void {
    input.setAttribute('autocomplete', 'new-password');
  }

  private addReadOnlyAttribute(input: HTMLInputElement): void {
    input.setAttribute('readonly', 'true');
  }
}
