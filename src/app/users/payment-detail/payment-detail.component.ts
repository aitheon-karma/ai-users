import { Component, OnInit, ViewChild } from '@angular/core';
import { Payment } from '../../dashboard/shared/payment';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { PaymentsService } from '../../dashboard/shared/payments.service';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';

@Component({
  selector: 'fl-payment-detail',
  templateUrl: './payment-detail.component.html',
  styleUrls: ['./payment-detail.component.scss']
})
export class PaymentDetailComponent implements OnInit {

  @ViewChild('detailModal') detailModal: ModalDirective;
  payment: Payment;
  loading = false;
  intervalId: any;
  timeout: string;
  timeoutDiff: number;
  timeoutInterval: any;

  constructor(
    private paymentsService: PaymentsService,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
  }

  show(payment: Payment) {
    this.payment = payment;
    this.loading = true;
    this.loadPayment();
    this.startRefreshTimer();
    this.detailModal.show();
  }

  loadPayment() {
    this.paymentsService.getById(this.payment._id).subscribe((p: Payment) => {
      this.payment = Object.assign(this.payment, p);
      this.loading = false;
    }, (err: any) => {
      this.loading = false;
      this.toastr.error(err);
    });
  }

  hide() {
    this.detailModal.hide();
  }

  onHide() {
    this.clearRefreshInterval();
  }

  clearRefreshInterval() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.intervalId = null;
    if (this.timeoutInterval) {
      clearInterval(this.timeoutInterval);
    }
    this.timeoutInterval = null;
  }

  startRefreshTimer() {
    if (this.payment.status === 'PENDING' || this.payment.status === 'PAID') {
      this.intervalId = setInterval(() => {
        this.loadPayment();
      }, 120 * 1000);
      this.initTimeout();
    }
  }

  initTimeout() {
    if (!this.payment) {
      return ' - ';
    }
    const createdAt = moment.utc(this.payment.createdAt);
    createdAt.add(this.payment.extra.timeout, 'seconds');
    const now = moment.utc();
    this.timeoutDiff = createdAt.diff(now) as any;
    if (this.timeoutDiff < 0) {
      this.timeout = ' - ';
    } else {
      const duration = moment.duration(this.timeoutDiff);
      this.timeout = `${ duration.hours() }h ${ duration.minutes() }m ${ duration.seconds() }s`;
      this.initTimeoutInterval();
    }
  }

  initTimeoutInterval() {
    this.timeoutInterval = setInterval(() => {
      this.timeoutDiff = this.timeoutDiff - 1000;
      const duration = moment.duration(this.timeoutDiff);
      this.timeout = `${ duration.hours() }h ${ duration.minutes() }m ${ duration.seconds() }s`;
    }, 1000);
  }
}
