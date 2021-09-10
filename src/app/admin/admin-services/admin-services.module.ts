import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminServicesRoutingModule } from './admin-services-routing.module';
import { AdminServicesDashboardComponent } from './admin-services-dashboard/admin-services-dashboard.component';
import { AdminServicesFormComponent } from './admin-services-form/admin-services-form.component';
import { AdminServicesListComponent } from './admin-services-list/admin-services-list.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CoreClientModule } from '@aitheon/core-client';
import { SharedModule } from '../../shared/shared.module';

@NgModule({
  declarations: [AdminServicesDashboardComponent, AdminServicesFormComponent, AdminServicesListComponent],
  imports: [
    CommonModule,
    AdminServicesRoutingModule,
    ReactiveFormsModule,
    CoreClientModule,
    SharedModule
  ]
})
export class AdminServicesModule { }
