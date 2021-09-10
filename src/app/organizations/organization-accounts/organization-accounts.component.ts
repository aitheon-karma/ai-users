import { ModalDirective } from 'ngx-bootstrap/modal';
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { UserAccountsService } from '../../users/shared/user-accounts.service';

@Component({
  selector: 'fl-organization-accounts',
  templateUrl: './organization-accounts.component.html',
  styleUrls: ['./organization-accounts.component.scss']
})
export class OrganizationAccountsComponent implements OnInit {

  @ViewChild('accountModal') public accountModal: ModalDirective;
  @ViewChild('upworkCompanyModal') public upworkCompanyModal: ModalDirective;
  @Input() organizationId: string;

  selectedAccount: any;
  upworkRoles;
  selectedRole: any;
  upworkLoading = false;
  constructor(
    private route: ActivatedRoute,
    private toastr: ToastrService,
    private userAccountsService: UserAccountsService
  ) { }

  ngOnInit() {

    if (this.route.snapshot.queryParams['upwork-success'] === 'true') {
      setTimeout(() => {
        this.toastr.success('Please select a company');
        this.loadUpworkRoles();
        this.upworkCompanyModal.show();
      }, 250);
    }
  }

  loadUpworkRoles() {
    this.userAccountsService.upworkRoles().subscribe((roles: Array<any>) => {
      this.upworkRoles = roles;
    })
  }

  saveUpworkRoles() {
    if (!this.selectedRole) {
      return;
    }
    this.userAccountsService.saveUpworkRoles(this.selectedRole.company__reference).subscribe(() => {
      this.upworkCompanyModal.hide();
      this.toastr.success('Upwork account activated.');
    })
  }

  selectNest() {
    this.selectedAccount = { type: 'NEST', header: 'Nest' };
    this.accountModal.show();
  }

  selectUpwork() {
    // this.selectedAccount = { type: 'UPWORK', header: 'Upwork' };
    // this.accountModal.show();
    this.getUpworkToken();
  }

  getUpworkToken() {
    if (this.upworkLoading) {
      return;
    }
    this.toastr.success('You will be redirected to Upwork login form in a moment...');
    this.upworkLoading = true;
    this.userAccountsService.getUpworkToken().subscribe((x: { url: string }) => {
      window.location.href  = x.url;
    }, (error) => {
      this.toastr.error(error);
    });
  }

  onModalHidden() {
    this.selectedAccount = null;
  }

  onAccountSaved() {
    this.accountModal.hide();
  }

  onAccountCanceled() {
    this.accountModal.hide();
  }

  selectRole(role: any) {
    this.selectedRole = role;
  }

}
