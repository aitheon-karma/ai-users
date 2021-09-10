import { SelectDropDownModule } from 'ngx-select-dropdown';
import { FilesModule } from '../files/files.module';
import { CoreClientModule } from '@aitheon/core-client';
import { NgModule } from '@angular/core';

import { OrganizationsRoutingModule } from './organizations-routing.module';
import { OrganizationFormComponent } from './organization-form/organization-form.component';
import { OrganizationsComponent } from './organizations.component';
import { OrganizationsService } from './shared';
import { OrganizationDetailComponent } from './organization-detail/organization-detail.component';
import { SharedModule } from '../shared/shared.module';
import { UsersModule } from '../users/users.module';
import { TeamsModule } from '../teams/teams.module';
import { OrganizationSetupComponent } from './organization-setup/organization-setup.component';

import { OrganizationAccountsComponent } from './organization-accounts/organization-accounts.component';

import { TimepickerModule } from 'ngx-bootstrap/timepicker';
import { OrganizationAddressFormComponent } from './organization-address-form/organization-address-form.component';
import { OrganizationServicesFormComponent } from './organization-services-form/organization-services-form.component';
import { OrganizationAboutComponent } from './organization-detail/organization-about/organization-about.component';
import { OrganizationSettingsComponent } from './organization-settings/organization-settings.component';
import { AccordionModule } from 'ngx-bootstrap/accordion';
import { OrganizationEmployeesComponent } from './organization-members/organization-members.component';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { OrganizationServicesComponent } from './organization-settings/organization-services/organization-services.component';
import { OrganizationCompanyRegistrationComponent } from './organization-settings/organization-company-registration/organization-company-registration.component';
import { OrganizationDocumentsComponent } from './organization-settings/organization-documents/organization-documents.component';
import { OrganizationDocumentsFormComponent } from './organization-settings/organization-documents-form/organization-documents-form.component';
import { AvatarModule } from 'ngx-avatar';

// import { OrganizationLocationsComponent } from './organization-settings/organization-locations/organization-locations.component';
import { OrganizationInterfacesComponent } from './organization-settings/organization-interfaces/organization-interfaces.component';
import { ProjectsService } from './shared';
import { OrganizationMemberFormComponent } from './organization-members/organization-member-form/organization-member-form.component';
import { OrganizationMemberPickFormComponent } from './organization-members/organization-member-pick-form/organization-member-pick-form.component';
import { OrganizationDocumentsComponentExternal } from './External/organization-documents/organization-documents.component';
import { OrganizationDocumentsFormComponentExternal } from './External/organization-documents-form/organization-documents-form.component';
import { TruncatePipe } from './shared/pipes/truncate.pipe';
import { OrganizationBotsComponent } from './organization-bots/organization-bots.component';
import { OrganizationLocationsFormComponent } from './organization-locations/organization-locations-form/organization-locations-form.component';
import { OrganizationLocationsCardComponent } from './organization-locations/organization-locations-card/organization-locations-card.component';
import { OrganizationLocationsComponent } from './organization-locations/organization-locations.component';

@NgModule({
  imports: [
    CoreClientModule,
    SharedModule,
    OrganizationsRoutingModule,
    TeamsModule,
    UsersModule,
    FilesModule,
    AvatarModule,
    AccordionModule.forRoot(),
    TypeaheadModule.forRoot(),
    TimepickerModule.forRoot(),
    SelectDropDownModule
  ],
  declarations: [
    OrganizationDocumentsFormComponentExternal,
    OrganizationDocumentsComponentExternal,
    OrganizationFormComponent,
    OrganizationsComponent,
    OrganizationDetailComponent,
    OrganizationSetupComponent,
    OrganizationAccountsComponent,
    OrganizationServicesFormComponent,
    OrganizationAddressFormComponent,
    OrganizationDetailComponent,
    OrganizationAboutComponent,
    OrganizationSettingsComponent,
    OrganizationEmployeesComponent,
    OrganizationServicesComponent,
    OrganizationCompanyRegistrationComponent,
    OrganizationDocumentsComponent,
    OrganizationDocumentsFormComponent,
    OrganizationLocationsComponent,
    OrganizationInterfacesComponent,
    OrganizationMemberFormComponent,
    OrganizationMemberPickFormComponent,
    TruncatePipe,
    OrganizationBotsComponent,
    OrganizationLocationsFormComponent,
    OrganizationLocationsCardComponent
  ],
  providers: [
    OrganizationsService,
    ProjectsService
  ],
  exports: [
    OrganizationServicesFormComponent
  ]
})
export class OrganizationsModule { }
