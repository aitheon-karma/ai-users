import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AdminQuestionsDashboardComponent } from './admin-questions-dashboard/admin-questions-dashboard.component';

const routes: Routes = [];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminQuestionsRoutingModule { }
