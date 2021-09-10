import { NgModule } from '@angular/core';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardComponent } from './dashboard.component';
import { CoreClientModule } from '@aitheon/core-client';
import { SharedModule } from '../shared/shared.module';
import { DashboardService, UserReferralService } from './shared';
import { ModalModule } from 'ngx-bootstrap/modal';
import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { TabsModule } from 'ngx-bootstrap/tabs';
import { BuyTokensComponent } from './buy-tokens/buy-tokens.component';
import { QRCodeModule } from 'angular2-qrcode';
import { ClipboardModule } from 'ngx-clipboard';
import { PaymentsService } from './shared/payments.service';
import { FileUploadModule } from 'ng2-file-upload';

import { WidgetProfileComponent } from './widgets/widget-profile/widget-profile.component';
import { WidgetFeedComponent } from './widgets/widget-feed/widget-feed.component';
import { WidgetTreasuryAccountsComponent } from './widgets/widget-treasury-accounts/widget-treasury-accounts.component';
import { WidgetOrganizationComponent } from './widgets/widget-organization/widget-organization.component';
import { WidgetCommunitiesComponent } from './widgets/widget-communities/widget-communities.component';
import { WidgetCreatorsStudioComponent } from './widgets/widget-creators-studio/widget-creators-studio.component';
import { TooltipModule } from 'ngx-tooltip';
import { GridsterModule } from 'angular-gridster2';
import { WidgetPlatformIntroduceComponent } from './widgets/widget-platform-introduce/widget-platform-introduce.component';
import { WidgetMarketComponent } from './widgets/widget-market/widget-market.component';
import { WidgetMyOrganizationComponent } from './widgets/widget-my-organization/widget-my-organization.component';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { WidgetTreasuryCryptoAccountsComponent } from './widgets/widget-treasury-crypto-accounts/widget-treasury-crypto-accounts.component';
import { FormsModule } from '@angular/forms';
import { WidgetAitheonAccountComponent } from './widgets/widget-aitheon-account/widget-aitheon-account.component';
import { ServicesMapComponent } from './services-map/services-map.component';
import { AiLoadComponent } from './shared/ai-load/ai-load.component';
import { ServiceModalComponent } from './service-modal/service-modal.component';
import { ApplicationsDashboardComponent } from './applications-dashboard/applications-dashboard.component';

@NgModule({
  imports: [
    CoreClientModule,
    DashboardRoutingModule,
    SharedModule,
    ModalModule,
    SweetAlert2Module,
    GridsterModule,
    QRCodeModule,
    ClipboardModule,
    TabsModule,
    FormsModule,
    FileUploadModule,
    TooltipModule,
    NgxChartsModule
  ],
  declarations: [
    DashboardComponent,
    BuyTokensComponent,
    WidgetProfileComponent,
    WidgetFeedComponent,
    WidgetTreasuryAccountsComponent,
    WidgetOrganizationComponent,
    WidgetCommunitiesComponent,
    WidgetCreatorsStudioComponent,
    WidgetPlatformIntroduceComponent,
    WidgetMarketComponent,
    WidgetMyOrganizationComponent,
    WidgetTreasuryCryptoAccountsComponent,
    WidgetAitheonAccountComponent,
    ServicesMapComponent,
    AiLoadComponent,
    ServiceModalComponent,
    ApplicationsDashboardComponent
  ],
  providers: [
    DashboardService,
    UserReferralService,
    PaymentsService,
  ]
})
export class DashboardModule { }
