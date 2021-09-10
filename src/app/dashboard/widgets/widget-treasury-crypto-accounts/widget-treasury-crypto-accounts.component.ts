import { Component, OnInit, Input } from '@angular/core';
import { AccountsRestService, Account } from '@aitheon/treasury';
import { ToastrService } from 'ngx-toastr';
@Component({
  selector: 'ai-widget-treasury-crypto-accounts',
  templateUrl: './widget-treasury-crypto-accounts.component.html',
  styleUrls: ['./widget-treasury-crypto-accounts.component.scss']
})
export class WidgetTreasuryCryptoAccountsComponent implements OnInit {

  @Input() editMode: boolean;
  @Input() externalEthAccounts: Account[];

  loading = false;

  submitted = false;
  aitheonEthAccount: Account;
  accounts: Account[];


  constructor(
    private accountsRestService: AccountsRestService,
    private toastr: ToastrService,
  ) { }

  ngOnInit() {

  }

  viewAccounts() {
    window.location.href = '/treasury/accounts';
  }


}
