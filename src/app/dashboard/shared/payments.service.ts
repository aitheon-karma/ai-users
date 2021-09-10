import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService } from '@aitheon/core-client';
import { Payment } from './payment';

@Injectable({providedIn: 'root'})
export class PaymentsService {

  constructor(private restService: RestService) { }

  createTransactions(sentCurrency: String, amount: Number): Observable<any> {
    return this.restService.post(`/api/payments/transactions`, { sentCurrency, amount });
  }

  rates(): Observable<any> {
    return this.restService.fetch(`/api/payments/rates`);
  }

  list(): Observable<Payment[]> {
    return this.restService.fetch(`/api/payments`);
  }

  getById(id: string): Observable<Payment> {
    return this.restService.fetch(`/api/payments/${ id }`);
  }

}

