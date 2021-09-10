import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { AuthService } from '@aitheon/core-client';
import { first } from 'rxjs/operators';
import { DashboardService } from 'app/dashboard/shared';
import { Subscription } from 'rxjs/Subscription';

import * as shape from 'd3-shape';
import * as moment from 'moment';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'ai-widget-my-organization',
  templateUrl: './widget-my-organization.component.html',
  styleUrls: ['./widget-my-organization.component.scss']
})
export class WidgetMyOrganizationComponent implements OnInit, OnDestroy {

  maxDate = new Date();
  single: any[];
  view: any[] = [520, 230];
  showXAxis = true;
  showYAxis = true;
  gradient = false;
  showLegend = false;
  showXAxisLabel = false;
  showYAxisLabel = false;
  timeline = true;
  dateValue: {fromDate: Date, toDate: Date, organizationId: string};
  organizationId: any;
  loading = true;
  noAccess = false;
  dateForm: FormGroup;
  curve: any = shape.curveMonotoneX;
  dateFormSubscription: Subscription;
  graphSubscription: Subscription;

  bsRangeValue: Date[] = [moment().subtract(7, 'days').toDate(), new Date()];

  colorScheme = {
    domain: ['#5595df', '#e2c366', '#DA7C30']
  };

  constructor(
    private authService: AuthService,
    private dashboardService: DashboardService,
  ) {}

  async ngOnInit() {
    this.initForm();
    this.organizationId = (await this.authService.activeOrganization.pipe(first()).toPromise());
    if (!this.organizationId) { return; } else { this.organizationId = this.organizationId._id; }

    this.setDateValues();
    this.refreshDashboard();
  }

  initForm() {
    this.dateForm = new FormGroup({
      dateRange: new FormControl([null, null], Validators.required),
    });
    this.dateFormSubscription = this.dateForm.valueChanges
      .subscribe(({ dateRange }) => {
        this.setDateValues(dateRange);
        this.refreshDashboard();
      });
  }

  setDateValues(dates?: Date[]) {
    // @ts-ignore
    const [fromDate, toDate] = dates || [];
    const [defaultFromDate, defaultToDate] = this.bsRangeValue;
    if (fromDate && toDate) {
      this.dateValue = {
        fromDate: moment(fromDate).startOf('day').toDate(),
        toDate: moment(toDate).startOf('day').toDate(),
        organizationId: this.organizationId
      };
    } else {
      this.dateValue = {
        fromDate: defaultFromDate,
        toDate: defaultToDate,
        organizationId: this.organizationId,
      };
    }
  }

  refreshDashboard() {
    this.loading = true;
    this.graphSubscription = this.dashboardService
      .getOrganizationStats(this.dateValue.fromDate, this.dateValue.toDate)
      .subscribe(graphData => {
        this.loading = false;
        this.buildGraph(graphData);
        },
        () => {
        this.loading = false;
        this.noAccess = true;
      });
  }

  buildGraph(graphData: Array<{Expenses: number, Profit: number, Revenue: number, date: Date}>) {
    const max = Math.max(...graphData.map(g => g.Revenue));
    const expences = {
      name: 'Expences',
      series: graphData.map(g => {
        return {
          name: moment(g.date).format('DD/MM'),
          value: g.Expenses,
          min: 0,
          max: max
        };
      })
    };

    const profit = {
      name: 'Profit',
      series: graphData.map(g => {
        return {
          name: moment(g.date).format('DD/MM'),
          value: g.Profit,
          min: 0,
          max: max
        };
      })
    };

    const revenue = {
      name: 'Revenue',
      series: graphData.map(g => {
        return {
          name: moment(g.date).format('DD/MM'),
          value: g.Revenue,
          min: 0,
          max: max
        };
      })
    };
    this.single = [expences, profit, revenue];

  }

  clearDate(event: Event) {
    event.stopPropagation();
    event.preventDefault();

    this.dateForm.reset();
  }

  ngOnDestroy() {
    this.graphSubscription.unsubscribe();
  }

}
