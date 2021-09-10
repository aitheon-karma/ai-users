import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrganizationsComponent } from './organizations.component';
import { OrganizationDetailComponent } from './organization-detail/organization-detail.component';
import { OrganizationSetupComponent } from './organization-setup/organization-setup.component';

const routes: Routes = [
  {
    path: '',
    component: OrganizationsComponent,
  },
  {
    path: 'setup',
    component: OrganizationSetupComponent
  },
  {
    path: 'setup/:isExternal',
    component: OrganizationSetupComponent
  },
  {
    path: 'setup/:isExternal/:currentStep/:oldOrg/:newOrgId/:orgDomain',
    component: OrganizationSetupComponent
  },
  {
    path: 'organization-detail',
    component: OrganizationDetailComponent
  },
  {
    path: 'organization-detail/:tab',
    component: OrganizationDetailComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
  providers: []
})
export class OrganizationsRoutingModule { }
