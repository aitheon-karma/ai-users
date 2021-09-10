import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { EmailValidators } from 'ng2-validators';
import { UsersService } from '../shared';

@Component({
  selector: 'fl-user-forgot-password',
  templateUrl: './user-forgot-password.component.html',
  styleUrls: ['./user-forgot-password.component.scss']
})
export class UserForgotPasswordComponent implements OnInit, OnDestroy {

  userForm: FormGroup;
  submitted = false;
  loading = false;
  error: any;
  success: any;
  token: string;
  tokenInvalid: boolean;
  disabledStatus: boolean;

  constructor(
    private fb: FormBuilder,
    private usersService: UsersService
  ) { }

  ngOnInit() {
    this.buildForm();
    this.setInputChangesListeners();
    document.body.className += ' pattern-page';
    document.querySelector('body').classList.add('reset-password');
  }

  ngOnDestroy(): void {
    document.body.className = '';
  }

  buildForm(): void {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, EmailValidators.normal]],
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.userForm.invalid) {
      this.error = 'The email address you entered is incorrect.';

      return;
    }

    this.error = null;
    this.forgotPassword(this.userForm.get('email').value);
  }

  forgotPassword(email: string): void {
    this.loading = true;
    this.usersService.forgotPassword(email).subscribe(() => {
      this.submitted = false;
      this.loading = false;
      this.success = 'An email has been sent to the provided email with further instructions.'
    }, (error) => {
      this.loading = false;
      this.handleError(error);
    });
  }

  handleError(error: any) {
    this.error = error;
  }

  private setInputChangesListeners(): void {
    this.userForm.get('email').valueChanges
      .subscribe(value => {
        const whitespacePattern = /\s/g;
        const isWhitespaces = whitespacePattern.test(value);

        if (isWhitespaces) {
          this.userForm.get('email').setValue(value.replace(whitespacePattern, ''));
        }
      });
  }
}
