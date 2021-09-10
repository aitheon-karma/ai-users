import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdminRoutingModule } from './admin-routing.module';
import { AdminComponent } from './admin.component';
import { AdminQuestionsModule } from './admin-questions/admin-questions.module';
import { AdminUserTypesComponent } from './admin-user-types/admin-user-types.component';
import { AdminUserTypesListComponent } from './admin-user-types/admin-user-types-list/admin-user-types-list.component';
import { AdminUserTypesFormComponent } from './admin-user-types/admin-user-types-form/admin-user-types-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CoreClientModule } from '@aitheon/core-client';
import { SharedModule } from '../shared/shared.module';
import { AdminTutorialsModule } from './admin-tutorials/admin-tutorials.module';
import { AdminServicesModule } from './admin-services/admin-services.module';
import { CoreModule } from '../core/core.module';

@NgModule({
  declarations: [AdminComponent, AdminUserTypesComponent, AdminUserTypesListComponent, AdminUserTypesFormComponent],
  imports: [
    CommonModule,
    AdminRoutingModule,
    AdminQuestionsModule,
    AdminTutorialsModule,
    AdminServicesModule,
    ReactiveFormsModule,
    CoreClientModule,
    CoreModule,
    SharedModule
  ]
})
export class AdminModule { }
