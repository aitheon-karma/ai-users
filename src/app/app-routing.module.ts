import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { IsSysadminGuardService } from './shared/isSysadmin.guard.service';
import { PlatformRoleGuardService } from './shared/platform-role.guard.service';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'organizations', loadChildren: './organizations/organizations.module#OrganizationsModule'},
  { path: 'dashboard', loadChildren: './dashboard/dashboard.module#DashboardModule'},
  { path: 'admin', loadChildren: './admin/admin.module#AdminModule', canActivate: [PlatformRoleGuardService]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }
