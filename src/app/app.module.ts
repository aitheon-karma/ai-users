
import { NotificationsModule } from './notifications/notifications.module';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { environment } from '../environments/environment';
import { CoreClientModule } from '@aitheon/core-client';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { TreasuryModule, ConfigurationParameters, Configuration } from '@aitheon/treasury';
import { SharedModule } from './shared/shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { UsersModule } from './users/users.module';
import { TemplateModule as PlatformSupportModule } from '@aitheon/platform-support';
import { CommunicationsModule } from '@aitheon/communications';
import { OrganizationsModule } from './organizations/organizations.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { CreatorsStudioModule } from '@aitheon/creators-studio';

export function treasuryApiConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: `${environment.baseApi}/treasury`
  };
  return new Configuration(params);
}

export function apiPlatformSupportConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: environment.baseApi + '/platform-support',
  };
  return new Configuration(params);
}

export function apiCreatorsStudioConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: environment.baseApi + '/creators-studio',
  };
  return new Configuration(params);
}

export function apiCommunicationsConfigFactory(): Configuration {
  const params: ConfigurationParameters = {
    basePath: environment.baseApi + '/communications',
  };
  return new Configuration(params);
}

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    TreasuryModule.forRoot(treasuryApiConfigFactory),
    CoreClientModule.forRoot({
      baseApi: environment.baseApi,
      production: environment.production,
      service: 'USERS'
    }),
    PlatformSupportModule.forRoot(apiPlatformSupportConfigFactory),
    CommunicationsModule.forRoot(apiCommunicationsConfigFactory),
    CreatorsStudioModule.forRoot(apiCreatorsStudioConfigFactory),
    AppRoutingModule,
    NotificationsModule,
    SharedModule,
    ServiceWorkerModule.register('/users/sw-custom.js', { enabled: environment.production }),
    OrganizationsModule,
    UsersModule,
    TooltipModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
