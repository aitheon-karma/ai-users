import { Component, OnInit, Input } from '@angular/core';
import { AuthService } from '@aitheon/core-client';

@Component({
  selector: 'fl-kyc-form',
  templateUrl: './kyc-form.component.html',
  styleUrls: ['./kyc-form.component.scss']
})
export class KycFormComponent implements OnInit {


  user: any;
  success: boolean;
  kycDocumentsDone: boolean;

  constructor(
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.authService.currentUser.subscribe((user: any) => {
      this.user = user;
      this.checkStatus();
    });
  }

  onKYCDocumentsSuccess() {
    // success
    this.kycDocumentsDone = true;
    this.checkStatus();
  }

  checkStatus() {
    if (!this.user || !this.kycDocumentsDone) {
      return;
    }

    this.success = true;
  }

}
