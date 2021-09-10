import { UserAccountsService } from './../users/shared/user-accounts.service';
import { CoreClientModule } from '@aitheon/core-client';
import { NgModule } from '@angular/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { ModalModule } from 'ngx-bootstrap/modal';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { ServicesListComponent, ServicesService, ServiceNameDirective } from './../services/shared';
import { TeamsService } from './../teams/shared/teams.service';
import { UsersService } from './../users/shared/users.service';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { SafeHtmlPipe, MomentFormatPipe } from './pipes';
import { PaginationComponent } from './pagination/pagination.component';
import { UserConnectionsService } from './../users/shared/user-connections.service';
import { QuestionsModalComponent } from './questions/questions-modal/questions-modal.component';
import { IsSysadminGuardService } from './isSysadmin.guard.service';
import { GenericConfirmComponent } from './generic-confirm/generic-confirm.component';
import { EditDatePipe } from './pipes/edit-date.pipe';
import { PrettyEnumPipe } from './pipes/pretty-enum.pipe';
import { QuestionsModalV2Component } from './questions/questions-modal-v2/questions-modal-v2.component';
import { SlugPipe } from './pipes/slug.pipe';
import { ServiceIconPipe } from './pipes/service-icon.pipe';
import { FiltersFormComponent } from './filters-form/filters-form.component';
import { SubscriptionModalComponent } from './subscription-modal/subscription-modal.component';
import { PaymentMethodModalComponent } from './payment-method-modal/payment-method-modal.component';

@NgModule({
  imports: [
    CoreClientModule,
    TabsModule.forRoot(),
    TooltipModule.forRoot(),
    ModalModule.forRoot(),
    SweetAlert2Module.forRoot(),
  ],
  exports: [
    SweetAlert2Module,
    TabsModule,
    TooltipModule,
    ModalModule,
    ServicesListComponent,
    SafeHtmlPipe,
    SlugPipe,
    MomentFormatPipe,
    PrettyEnumPipe,
    EditDatePipe,
    PaginationComponent,
    QuestionsModalComponent,
    QuestionsModalV2Component,
    GenericConfirmComponent,
    ServiceIconPipe,
    FiltersFormComponent,
    SubscriptionModalComponent,
    PaymentMethodModalComponent
  ],
  declarations: [
    ServicesListComponent,
    ServiceNameDirective,
    SafeHtmlPipe,
    MomentFormatPipe,
    EditDatePipe,
    PrettyEnumPipe,
    PaginationComponent,
    QuestionsModalComponent,
    SlugPipe,
    GenericConfirmComponent,
    QuestionsModalV2Component,
    ServiceIconPipe,
    FiltersFormComponent,
    SubscriptionModalComponent,
    PaymentMethodModalComponent
  ],
  providers: [
    ServicesService,
    TeamsService,
    UsersService,
    UserAccountsService,
    UserConnectionsService,
    IsSysadminGuardService
  ]
})
export class SharedModule { }
