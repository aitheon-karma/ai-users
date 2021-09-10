import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AdminComponent } from './admin.component';
import { AdminQuestionsDashboardComponent } from './admin-questions/admin-questions-dashboard/admin-questions-dashboard.component';
import { AdminUserTypesComponent } from './admin-user-types/admin-user-types.component';
import { AdminTutorialsMediaComponent } from './admin-tutorials/admin-tutorials-media/admin-tutorials-media.component';
import { AdminServicesDashboardComponent } from './admin-services/admin-services-dashboard/admin-services-dashboard.component';

const routes: Routes = [
  { path: '', component: AdminComponent, children: [
    { path: 'questions', component: AdminQuestionsDashboardComponent},
    { path: 'services', component: AdminServicesDashboardComponent},
    { path: 'users', component: AdminUserTypesComponent},
    { path: 'tutorials/media', component: AdminTutorialsMediaComponent},
  ]}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
