import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { Payment } from '../../dashboard/shared/payment';
import { PaymentDetailComponent } from '../payment-detail/payment-detail.component';
import { PaymentsService } from '../../dashboard/shared/payments.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'fl-my-payments',
  templateUrl: './my-payments.component.html',
  styleUrls: ['./my-payments.component.scss']
})
export class MyPaymentsComponent implements OnInit {

  payments: Payment[];
  loading = false;
  @ViewChild('paymentDetail') paymentDetail: PaymentDetailComponent;

  constructor(
    private paymentsService: PaymentsService,
    private toastr: ToastrService
  ) { }

  ngOnInit() {
    this.loading = true;
    this.paymentsService.list().subscribe((payments: Payment[]) => {
      this.payments = payments;
      this.loading = false;
    }, (err: any) => {
      this.toastr.error(err);
    });
  }

  paymentCreated(payment: Payment) {
    if (!this.payments) {
      this.payments = [];
    }
    this.payments.push(payment);
    this.paymentDetail.show(payment);
  }

}
