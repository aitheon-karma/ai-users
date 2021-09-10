import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { AuthGuard } from '@aitheon/core-client';
import { OnBoardingGuardService as  OnBoardingGuard } from '../shared/onboarding.guard.service';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    canActivate:  [AuthGuard, OnBoardingGuard  ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class DashboardRoutingModule { }
