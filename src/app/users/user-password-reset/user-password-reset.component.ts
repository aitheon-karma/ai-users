import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, FormGroup, FormControl, FormArray, AbstractControl } from '@angular/forms';
import { EmailValidators, PasswordValidators, UniversalValidators } from 'ng2-validators';
import { AuthService } from '@aitheon/core-client';
import { UsersService } from '../shared';
import { ToastrService } from 'ngx-toastr';
import {setDay} from "ngx-bootstrap/chronos/utils/date-setters";

@Component({
  selector: 'fl-user-password-reset',
  templateUrl: './user-password-reset.component.html',
  styleUrls: ['./user-password-reset.component.scss']
})
export class UserPasswordResetComponent implements OnInit, OnDestroy {

  userForm: FormGroup;
  submitted = false;
  loading = false;
  error: any;
  success: any;
  token: string;
  tokenInvalid: boolean;
  redirectSeconds = 5;
  isValidForm: boolean;
  isButtonEnabled: boolean = false;
  timeLeft: number = 5;
  isMinLengthRuleSatisfied: boolean = false;
  isCaseRuleSatisfied: boolean = false;
  isDigitRuleSatisfied: boolean = false;
  isPasswordValid: boolean = true;
  isConfirmPasswordValid: boolean = true;
  confirmPasswordErrorMessage: string = '';
  interval;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService,
    private authService: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private toastr: ToastrService
  ) { }

  ngOnInit() {

    this.buildForm();

    this.token = this.activatedRoute.snapshot.params['token'];
    this.tokenInvalid = this.token === 'invalid';

    document.body.className += ' pattern-page';
    document.body.className += ' reset-password';
  }

  ngOnDestroy(): void {
    document.body.className = '';
  }

  buildForm(): void {
    this.userForm = this.fb.group({
      password: ['', Validators.compose([
        Validators.required,
        PasswordValidators.alphabeticalCharacterRule(1),
        PasswordValidators.digitCharacterRule(1),
        PasswordValidators.lowercaseCharacterRule(1),
        PasswordValidators.uppercaseCharacterRule(1),
        UniversalValidators.minLength(8),
        UniversalValidators.noWhitespace
      ])],
      confirmPassword: ['', Validators.required],
    });

    this.userForm.setValidators(PasswordValidators.mismatchedPasswords('password', 'confirmPassword'));

    this.setFormListeners();
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.userForm.invalid) {
      this.isValidForm = false;

      this.showErrors();

      return;
    }

    this.isValidForm = true;

    this.error = null;
    this.resetPassword(this.userForm.get('password').value);
  }

  resetPassword(password: string): void {
    this.loading = true;
    this.usersService.resetPassword(this.token, password).subscribe((r: { email: string }) => {
      this.submitted = false;
      this.success = true;
      this.authService.init();
      this.toastr.success('Your password has been changed.');
      this.interval = setInterval(() => {
        if (this.timeLeft > 0) {
          this.timeLeft--;
        } else if (this.timeLeft == 0) {
          window.location.href = '/login';
        } else {
          this.timeLeft = 5;
        }
      },1000)
    }, (error) => {
      this.loading = false;
      this.handleError(error);
    });
  }

  handleError(error: any) {
    this.error = error;
  }

  public onLoginClick(): void {
    window.location.href = '/login';
  }

  public onRequestNewLink(): void {
    this.router.navigateByUrl('/forgot-password');
  }

  public togglePasswordType() {
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

  public togglePasswordTypeRepeat() {
    const passEye = document.getElementsByClassName('password-eye-repeat')[0],
      passInput: any = document.querySelector('.form-controll__password-input');

    if (passInput.type === 'password') {
      passEye.classList.add('show');
      passInput.type = 'text';
    } else {
      passEye.classList.remove('show');
      passInput.type = 'password';
    }
  }

  public preventCopy(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  private setFormListeners(): void {
    this.userForm.get('password').valueChanges.subscribe(val => {
      const isWhitespaces = /\s/.test(val);

      if (isWhitespaces) {
        this.userForm.get('password').setValue(val.replace(/\s/g, ''));
      }

      this.resetErrors();
      this.setButtonState();

      this.validatePassword();
    });

    this.userForm.get('confirmPassword').valueChanges.subscribe(val => {
      const isWhitespaces = /\s/.test(val);

      if (isWhitespaces) {
        this.userForm.get('confirmPassword').setValue(val.replace(/\s/g, ''));
      }

      this.confirmPasswordErrorMessage = '';

      this.resetErrors();
      this.setButtonState();
    });
  }

  private validatePassword(): void {
    this.isMinLengthRuleSatisfied = !this.userForm.get('password').hasError('required')
      && !this.userForm.get('password').hasError('minLength');
    this.isCaseRuleSatisfied = !this.userForm.get('password').hasError('required')
      && !this.userForm.get('password').hasError('lowercaseCharacterRule')
      && !this.userForm.get('password').hasError('uppercaseCharacterRule');
    this.isDigitRuleSatisfied = !this.userForm.get('password').hasError('required')
      && !this.userForm.get('password').hasError('digitCharacterRule');
  }

  private showErrors(): void {
    const isPasswordInvalid = !this.userForm.get('password').valid;
    const isConfirmPasswordInvalid = !this.userForm.get('confirmPassword').valid;

    if (isPasswordInvalid) {
      this.isPasswordValid = false;

      this.validatePassword();
    } else {
      if (isConfirmPasswordInvalid) {
        this.isConfirmPasswordValid = false;

        this.confirmPasswordErrorMessage = 'Passwords should match';
      }
    }
  }

  private setButtonState(): void {
    const isPasswordEntered = this.userForm.get('password').value.length > 0;
    const isConfirmPasswordEntered = this.userForm.get('confirmPassword').value.length > 0;

    this.isButtonEnabled = isPasswordEntered || isConfirmPasswordEntered;
  }

  private resetErrors(): void {
    this.isPasswordValid = true;
    this.isConfirmPasswordValid = true;
    this.submitted = false;
  }
}
