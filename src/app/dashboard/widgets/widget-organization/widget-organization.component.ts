import { Component, OnInit, Input, OnChanges } from '@angular/core';
import { AccountsRestService } from '@aitheon/treasury';

@Component({
  selector: 'fl-widget-organization',
  templateUrl: './widget-organization.component.html',
  styleUrls: ['./widget-organization.component.scss']
})
export class WidgetOrganizationComponent implements OnInit, OnChanges {

  constructor(private accountService: AccountsRestService) { }

  @Input() orgTrialBalance: number;
  loading = true;

  ngOnInit() {
  }

  ngOnChanges() {
    this.loading = this.orgTrialBalance === undefined ? true : false;
  }

}
