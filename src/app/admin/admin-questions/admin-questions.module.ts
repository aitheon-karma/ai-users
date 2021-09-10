import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { ReactiveFormsModule } from '@angular/forms';

import { CoreClientModule } from '@aitheon/core-client';
import { AdminQuestionsRoutingModule } from './admin-questions-routing.module';
import { AdminQuestionsListComponent } from './admin-questions-list/admin-questions-list.component';
import { AdminQuestionsDashboardComponent } from './admin-questions-dashboard/admin-questions-dashboard.component';
import { AdminQuestionFormComponent } from './admin-question-form/admin-question-form.component';
import { CoreModule } from '../../core/core.module';

import { TabsModule } from 'ngx-bootstrap/tabs';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { ServicesModule } from '../../services/services.module';


@NgModule({
  declarations: [
    AdminQuestionsListComponent,
    AdminQuestionsDashboardComponent,
    AdminQuestionFormComponent,
  ],
  imports: [
    CommonModule,
    AdminQuestionsRoutingModule,
    TabsModule.forRoot(),
    NgSelectModule,
    ReactiveFormsModule,
    CoreClientModule,
    CoreModule,
    DragDropModule,
    ServicesModule
  ]
})
export class AdminQuestionsModule { }
