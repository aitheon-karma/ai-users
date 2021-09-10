import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '@aitheon/core-client';
import { User, UsersService } from '../shared';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
import { BsModalRef, BsModalService, ModalDirective } from 'ngx-bootstrap/modal';
import { SecondFactorModalComponent } from '../second-factor-modal/second-factor-modal.component';
import { environment } from '../../../environments/environment';
import { KycFormComponent } from '../../dashboard/kyc-form/kyc-form.component';

@Component({
  selector: 'fl-user-info',
  templateUrl: './user-info.component.html',
  styleUrls: ['./user-info.component.scss']
})
export class UserInfoComponent implements OnInit {

  profileLoaded = false;
  consentDelete = false;
  isFormChanged: boolean = false;
  currentUser: any;
  deleteAccountModalRef: BsModalRef;
  kycModalRef: BsModalRef;
  usernameModalRef: BsModalRef;
  isUpdating: boolean = false;

  @ViewChild('deleteAccountModal') deleteAccountModal: TemplateRef<any>;
  @ViewChild('secondFactorModal') secondFactorModal: SecondFactorModalComponent;
  @ViewChild('kycModal') kycModal: ModalDirective;
  @ViewChild('kycForm') kycForm: KycFormComponent;
  @ViewChild('usernameModal') usernameModal: ModalDirective;

  constructor(
    public authService: AuthService,
    private usersService: UsersService,
    private modalService: BsModalService,
    private toastr: ToastrService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.authService.currentUser.subscribe((user: User) => {
      this.currentUser = user;
      this.loadProfile();

      const { username } = this.route.snapshot.queryParams;
      if (username && !this.currentUser.username) {
        this.openUsernameModal();
      }
    });

  }

  loadProfile() {
    this.profileLoaded = false;
    this.usersService.profileDetail().subscribe((profile: any) => {
      if (profile.personal !== undefined) {
        this.currentUser.personal = profile.personal;
      }
      if (profile.professional !== undefined) {
        this.currentUser.professional = profile.professional;
      }
      if (profile.dating !== undefined) {
        this.currentUser.dating = profile.dating;
      }
      this.profileLoaded = true;
    }, (err: any) => {
      this.toastr.error(err);
    });
  }

  onSaved(user: User): void {
    const isNewAddress = this.currentUser.resend
      ? this.currentUser.resend.toLowerCase() !== user.email.toLowerCase()
      : false;

    if (isNewAddress) {
      this.toastr.success('Email verification link sent to your new address');
    }

    Object.assign(this.currentUser, user);

    this.isUpdating = false;
  }

  unlinkTelegram() {
    this.usersService.unlinkTelegram().subscribe(() => {
      this.authService.loadCurrentUser();
    });
  }

  resendVerifyEmail() {
    this.usersService.resendVerifyEmail().subscribe(() => {
      this.toastr.success('Link sent');
    }, (err) => {
      this.toastr.error(err);
    });
  }

  showDeleteAccount() {
    this.consentDelete = false;
    this.deleteAccountModalRef = this.modalService.show(this.deleteAccountModal);
  }

  onCloseDialog() {
    this.deleteAccountModalRef.hide();
  }

  openUsernameModal() {
    this.usernameModalRef = this.modalService.show(this.usernameModal);
  }

  secondFactorSuccess(event: { data: any, otpCode: string }) {
    if (event.data === 'PIN_REQUEST') {
      this.showDevicesPin(event.otpCode);
      return;
    }
    this.usersService.deleteAccount(event.otpCode).subscribe(() => {
      this.deleteAccountModalRef.hide();
      this.toastr.success('Account deleted. You will be logged out now.');
      setTimeout(() => {
        this.authService.logout().subscribe(() => {
          window.location.href = '/';
        });
      }, 5000);
    }, (err) => {
      this.toastr.error(err);
    });
  }

  requestDelete() {
    this.deleteAccountModalRef.hide();
    return this.secondFactorModal.request({});
  }

  requestPin() {
    return this.secondFactorModal.request('PIN_REQUEST');
  }

  showDevicesPin(otpCode: string) {
    this.usersService.showDevicesPin(otpCode).subscribe((devicesPin: string) => {
      this.currentUser.devicesPin = devicesPin;
    }, (err) => {
      this.toastr.error(err);
    });
  }

  public updateForm(): void {
    this.isUpdating = true;
  }

  public onCanceled(): void {
    setTimeout(() => {
      this.isUpdating = false;
    }, 0);
  }

  private updateButtonState(event: boolean): void {
    this.isFormChanged = event;
  }

  getTelegramRedirectURI() {
    return `${window.location.origin}${environment.production ? '/users' : ''}/api/users/telegram`;
  }

  // verifyUser(kycRef: TemplateRef<any>) {
  //   this.kycModalRef = this.modalService.show(kycRef, { class: 'modal-lg' });
  // }
  //
  // closeKYCModal() {
  //   this.kycModalRef.hide();
  // }
}
