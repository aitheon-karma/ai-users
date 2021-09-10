import { UserAccountsService } from './../../shared/user-accounts.service';
import { ToastrService } from 'ngx-toastr';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'fl-nest-account',
  templateUrl: './nest-account.component.html',
  styleUrls: ['./nest-account.component.scss']
})
export class NestAccountComponent implements OnInit {

  @Input() organizationId: String;
  @Output() canceled: EventEmitter<any> = new EventEmitter<any>();
  @Output() saved: EventEmitter<any> = new EventEmitter<any>();
  credentials: any;

  accountType = 'NEST';

  submitted = false;
  credentialsForm: FormGroup;
  error: any;

  constructor(
     private fb: FormBuilder,
     private toastr: ToastrService,
     private userAccountsService: UserAccountsService,
  ) { }

  ngOnInit() {
    this.userAccountsService.get(this.accountType, this.organizationId).subscribe((a: any) => {
      if (a && a.credentials) {
        this.credentials = a.credentials
      } else {
        this.credentials = { };
      }
      this.buildForm(this.credentials);
    })
  }

  buildForm(credentials: any) {
    this.credentialsForm = this.fb.group({
      productID: [credentials.productID, [ Validators.required ]],
      productSecret: [credentials.productSecret, [ Validators.required ]],
      authorizationURL: [credentials.authorizationURL, [ Validators.required ]],
    });
  }

  onSubmit({ value, valid }: { value: any, valid: boolean }): void {
    this.submitted = true;
    if (!valid) {
      return;
    }
    const credentials = Object.assign(this.credentials, value);

    this.userAccountsService.save(this.accountType, credentials, this.organizationId).subscribe((x: any) => {
      this.credentials = credentials;
      this.credentialsForm.reset(this.credentials);
      this.submitted = false;
      this.toastr.success('Account saved');
      this.saved.emit(x);
    }, (error) => this.handleError(error));
  }


  handleError(error: any) {
    this.error = error;
  }

  cancelClick() {
    this.credentialsForm.reset(this.credentials);
    this.submitted = false;
    this.canceled.emit();
  }

}
