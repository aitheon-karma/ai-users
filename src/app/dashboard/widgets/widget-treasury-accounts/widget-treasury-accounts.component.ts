import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { AccountsRestService, Account, FiatAccountsRestService, FiatAccount } from '@aitheon/treasury';
import { environment } from 'environments/environment';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@aitheon/core-client';
import { forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';

enum WidgetType {

  ETH = 'ETH',
  AITHEON = 'AITHEON',
  FIAT = 'FIAT'

}

@Component({
  selector: 'fl-widget-treasury-accounts',
  templateUrl: './widget-treasury-accounts.component.html',
  styleUrls: ['./widget-treasury-accounts.component.scss']
})
export class WidgetTreasuryAccountsComponent implements OnInit {

  constructor(private fiatAccountService: FiatAccountsRestService,
    private accountsService: AccountsRestService) { }

  @Input() editMode: boolean;
  @Input() orgTrialBalance: number;
  @Input() userTrialBalance: number;

  loading = false;
  submitted = false;
  aitheonEthAccount: Account;
  externalEthAccounts: Account[];
  accounts: FiatAccount[];
  ethAccounts: Account[];
  aitheonAccount: Account;
  totalAccountCount = 2;
  currentWidget: {
    type: WidgetType,
    index: number
  } = { type: WidgetType.FIAT, index: 0 };
  WidgetType = WidgetType;

  showNext = true;
  showPrevious = false;

  ngOnInit() {
    this.loadAccounts();
  }

  viewAccounts() {
    window.location.href = '/treasury/accounts';
  }

  loadAccounts() {
    this.loading = true;
      forkJoin([this.fiatAccountService.list(), this.accountsService.list()])
      .pipe(map(results => ({accounts: results[0], cryptoAccounts: results[1]}))).subscribe(allAccounts => {
        this.accounts = allAccounts.accounts;
        this.ethAccounts = allAccounts.cryptoAccounts.filter((a: Account) => a.type === Account.TypeEnum.EXTERNAL_ETH);
        this.aitheonAccount = allAccounts.cryptoAccounts.find((a: Account) => a.type === Account.TypeEnum.AITHEON_ETH);
        this.totalAccountCount = this.totalAccountCount + this.accounts.length;
        this.changeAccount(0);
        this.loading = false;
      });
  }

  get fiatAccountIndex() {
    return this.ethAccounts.length ? this.currentWidget.index - 2 : this.currentWidget.index - 1;
  }

  changeAccount(mode: number) {
    this.currentWidget.type = undefined;
    this.currentWidget.index = this.currentWidget.index + mode;
    this.showNext = true;
    this.showPrevious = true;

    // first is aitheon account
    if (this.currentWidget.index === 0) {
      this.currentWidget.type = WidgetType.AITHEON;
      if (!this.ethAccounts.length && !this.accounts.length) {
        this.showNext = false;
      }
    } else if (this.ethAccounts.length && this.currentWidget.index === 1) {
      this.currentWidget.type = WidgetType.ETH;
      this.showNext = this.accounts.length ? true : false;
    } else if (this.accounts.length && this.currentWidget.index > 1) {
      // fiat account;
      this.currentWidget.type = WidgetType.FIAT;
      if (this.currentWidget.index === this.accounts.length + 1) {
        this.showNext = false;
      }
    }

    if (this.currentWidget.index === 0) {
      this.showPrevious = false;
    } else {
      this.showPrevious = true;
    }

  }

}
