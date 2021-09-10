import { NestAccountComponent } from './accounts/nest-account/nest-account.component';
import { UserServicesComponent } from './user-services/user-services.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserRegisterComponent } from './user-register/user-register.component';
import { UserInfoComponent } from './user-info/user-info.component';
import { UserChangePasswordComponent } from './user-change-password/user-change-password.component';
import { UserSettingsComponent } from './user-settings/user-settings.component';
import { UserPasswordResetComponent } from './user-password-reset/user-password-reset.component';
import { UserForgotPasswordComponent } from './user-forgot-password/user-forgot-password.component';
import { UserNotificationsComponent } from './user-notifications/user-notifications.component';
import { ReferralComponent } from './referral/referral.component';
import { MyPaymentsComponent } from './my-payments/my-payments.component';
import { UserOnboardingComponent } from './user-onboarding/user-onboarding.component';
import { UsersSecurityComponent } from './users-security/users-security.component';

const routes: Routes = [
  {
    path: 'signup',
    component: UserRegisterComponent,
  },
  {
    path: 'signup/:isExternal',
    component: UserRegisterComponent,
  },
  {
    path: 'settings',
    component: UserSettingsComponent,
    children: [
      {
        path: '',
        component: UserInfoComponent,
      },
      {
        path: 'payments',
        component: MyPaymentsComponent,
      },
      {
        path: 'referral',
        component: ReferralComponent,
      },
      {
        path: 'change-password',
        component: UserChangePasswordComponent,
      },
      {
        path: 'notifications',
        component: UserNotificationsComponent,
      },
      {
        path: 'services',
        component: UserServicesComponent
      },
      {
        path: 'security',
        component: UsersSecurityComponent
      },
      {
        path: 'accounts/nest',
        component: NestAccountComponent
      }
    ]
  },
  {
    path: 'password/reset/:token',
    component: UserPasswordResetComponent
  },
  {
    path: 'forgot-password',
    component: UserForgotPasswordComponent
  },
  {
    path: 'profile',
    redirectTo: 'profile/personal',
    pathMatch: 'full'
  },
  {
    path: 'user/onboarding',
    component: UserOnboardingComponent
  }
  // Need to rework logic, old was wrong
  // {
  //   path: 'statistics',
  //   component: UserStatisticsComponent
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class UsersRoutingModule { }
