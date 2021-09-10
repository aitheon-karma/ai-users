import { NgModule } from '@angular/core';
import { SweetAlert2LoaderService } from '@sweetalert2/ngx-sweetalert2';
import { UsersListComponent } from './users-list/users-list.component';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';
import { SharedModule } from './../shared/shared.module';
import { CoreClientModule } from '@aitheon/core-client';
import { UserFormComponent } from './user-form/user-form.component';
import { UserRegisterComponent } from './user-register/user-register.component';
import { UsersRoutingModule } from './users-routing.module';
import { UserInfoComponent } from './user-info/user-info.component';
import { UserChangePasswordComponent } from './user-change-password/user-change-password.component';
import { UserSettingsComponent } from './user-settings/user-settings.component';
import { UserServicesComponent } from './user-services/user-services.component';
import { NestAccountComponent } from './accounts/nest-account/nest-account.component';
import { UserSettingsMenuComponent } from './user-settings-menu/user-settings-menu.component';
import { UserPasswordResetComponent } from './user-password-reset/user-password-reset.component';
import { UserForgotPasswordComponent } from './user-forgot-password/user-forgot-password.component';
import { TextMaskModule } from 'angular2-text-mask';
import { UserNotificationsComponent } from './user-notifications/user-notifications.component';
import { RecaptchaModule, RECAPTCHA_SETTINGS, RecaptchaSettings, RecaptchaFormsModule } from 'ng-recaptcha';
import { SecondFactorModalComponent } from './second-factor-modal/second-factor-modal.component';
import { ReferralComponent } from './referral/referral.component';
import { ClipboardModule } from 'ngx-clipboard';
import { MyPaymentsComponent } from './my-payments/my-payments.component';
import { PaymentDetailComponent } from './payment-detail/payment-detail.component';
import { QRCodeModule } from 'angular2-qrcode';
import { TimelineModule } from 'app/core/timeline-graph/timeline-graph.module';
import { TooltipModule } from 'ngx-tooltip';
import { InViewportModule } from '@thisissoon/angular-inviewport';
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { CollapseModule } from 'ngx-bootstrap/collapse';
import { SelectDropDownModule } from 'ngx-select-dropdown';
import { UserRegisterServicesFormComponent } from './user-register/user-register-services-form/user-register-services-form.component';
import { UserOnboardingComponent } from './user-onboarding/user-onboarding.component';
import { UsersSecurityComponent } from './users-security/users-security.component';
import { UserOnboardingTypeFormComponent } from './user-onboarding/user-onboarding-type-form/user-onboarding-type-form.component';
import { UserStatisticsComponent } from './user-statistics/user-statistics.component';
import { KycFormComponent } from '../dashboard/kyc-form/kyc-form.component';
import { KycDocumentsComponent } from '../dashboard/kyc-documents/kyc-documents.component';
import { KycDocumentUploaderComponent } from '../dashboard/kyc-document-uploader/kyc-document-uploader.component';
import { KYCDocumentStatusPipe } from '../dashboard/shared';
import { UsernameFormComponent } from './user-username-form/user-username-form.component';


@NgModule({
  imports: [
    CoreClientModule,
    SharedModule,
    NgxDatatableModule,
    UsersRoutingModule,
    TextMaskModule,
    RecaptchaModule.forRoot(),
    RecaptchaFormsModule,
    ClipboardModule,
    QRCodeModule,
    TimelineModule,
    TooltipModule,
    InViewportModule,
    BsDropdownModule.forRoot(),
    CollapseModule.forRoot(),
    SelectDropDownModule
  ],
  exports: [
    UsersListComponent,
    NestAccountComponent
  ],
  declarations: [
    UsersListComponent,
    KycFormComponent,
    KycDocumentsComponent,
    KycDocumentUploaderComponent,
    KYCDocumentStatusPipe,
    UserFormComponent,
    UserRegisterComponent,
    UserInfoComponent,
    UserChangePasswordComponent,
    UserSettingsComponent,
    UserServicesComponent,
    NestAccountComponent,
    UserSettingsMenuComponent,
    UserPasswordResetComponent,
    UserForgotPasswordComponent,
    UserNotificationsComponent,
    SecondFactorModalComponent,
    ReferralComponent,
    PaymentDetailComponent,
    MyPaymentsComponent,
    UserRegisterServicesFormComponent,
    UserOnboardingComponent,
    UsersSecurityComponent,
    UserOnboardingTypeFormComponent,
    UserStatisticsComponent,
    UsernameFormComponent
  ],
  providers: [
    {
      provide: RECAPTCHA_SETTINGS,
      useValue: { siteKey: '6LfPi04UAAAAADa62ZrzoUkpYK_640YQmFrO7HgO' } as RecaptchaSettings,
    },
  ]
})
export class UsersModule { }
