import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { AllServiceListComponent } from './shared/all-service-list/all-service-list.component';

@NgModule({
  imports: [
    CommonModule,
    SweetAlert2Module
  ],
  declarations: [
    AllServiceListComponent
  ],
  exports: [
    AllServiceListComponent
  ]
})
export class ServicesModule { }
