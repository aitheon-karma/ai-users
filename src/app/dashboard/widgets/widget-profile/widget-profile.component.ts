import { Component, OnInit, ViewEncapsulation, ViewChild, TemplateRef } from '@angular/core';
import { AuthService, NotificationsService, Notification } from '@aitheon/core-client';
import { User, UserConnectionsService, UsersService, KYCStatus } from '../../../users/shared';
import { ModalDirective, BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { KycFormComponent } from './../../kyc-form/kyc-form.component';
import { Template } from '@angular/compiler/src/render3/r3_ast';

@Component({
  selector: 'fl-widget-profile',
  templateUrl: './widget-profile.component.html',
  styleUrls: ['./widget-profile.component.scss']
})

export class WidgetProfileComponent implements OnInit {

  constructor(private authService: AuthService,
    private modalService: BsModalService) { }
  @ViewChild('kycModal') kycModal: ModalDirective;
  @ViewChild('kycForm') kycForm: KycFormComponent;

  user: User;
  profile: any;
  connectionsCount = 0;
  notificationsCount = 0;
  loading: Boolean = false;


  disabled = true;

  value = 1;

  kycModalRef: BsModalRef;

  ngOnInit() {
    this.loading = true;
    this.authService.currentUser.subscribe((user: any) => {

      this.user = user;
      this.loading = false;
    });
  }

  verifyUser(kycRef: TemplateRef<any>) {
    this.kycModalRef = this.modalService.show(kycRef, {class: 'modal-lg'});
  }


  getKYCStatusDetailed() {
    switch (this.user.KYCStatus) {
      case KYCStatus.NONE:
        return 'Please submit documents to start verification.';

      case KYCStatus.PENDING:
        return 'Documents uploaded, waiting for image recognition of ID';

      case KYCStatus.IMAGE_VERIFIED:
        return 'Verification in progress. Images matched ID.';

      case KYCStatus.VERIFY_FINISHED:
        return 'KYC background check run on verified ID and passed';

      case KYCStatus.DENIED_IMAGE:
        return 'Documents failed Image recognition. Please re-submit.';

      case KYCStatus.DENIED_BACKGROUND:
        return 'Documents failed Image recognition. Please re-submit';

      default:
        return 'KYC Verification Pending.';
    }
  }
}
