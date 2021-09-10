import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { Account } from '@aitheon/treasury';
import { AuthService } from '@aitheon/core-client';

@Component({
  selector: 'ai-widget-aitheon-account',
  templateUrl: './widget-aitheon-account.component.html',
  styleUrls: ['./widget-aitheon-account.component.scss']
})
export class WidgetAitheonAccountComponent implements OnInit, OnChanges {

  constructor(private authService: AuthService) { }

  @Input() aitheonAccount: Account;
  @Input() orgTrialBalance: number;
  @Input() userTrialBalance: number;

  ngOnInit() {
    if (!this.aitheonAccount) {
     this.aitheonAccount = new Account();
     this.aitheonAccount.tokens = {} as any;
    }
  }

  ngOnChanges() {
    this.authService.activeOrganization.subscribe(org => {
      if (org) {
        this.orgTrialBalance = 0;
        this.userTrialBalance = 0;
      }
    });
  }

  get total() {
    if (!this.aitheonAccount) {
      return 0;
    }
  }

}
