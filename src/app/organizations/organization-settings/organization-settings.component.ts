import { AuthService } from '@aitheon/core-client';
import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Params , Router} from '@angular/router';
import { FormGroup, FormBuilder, Validators, NgForm, FormArray } from '@angular/forms';
import { OrganizationsService, Organization } from './../shared';
import { environment } from '../../../environments/environment';

export enum OrganizationSettingTabs {
  SERVICES = 'SERVICES',
  INTERFACES = 'INTERFACES',
  COMPANY_INFO = 'COMPANY_INFO',
  DOCUMENTS = 'DOCUMENTS',
  LOCATIONS = 'LOCATIONS'
}

@Component({
  selector: 'fl-organization-settings',
  templateUrl: './organization-settings.component.html',
  styleUrls: ['./organization-settings.component.scss']
})
export class OrganizationSettingsComponent implements OnInit {
  currentTab = OrganizationSettingTabs.SERVICES;
  production: boolean = false;
  OrganizationSettingTabs = OrganizationSettingTabs;

  @Input() organization: Organization;

  constructor(private router: ActivatedRoute,
              private authService: AuthService) {
  }
  ngOnInit() {
    if (environment.production && this.authService.baseHost() === 'aitheon.com') {
      this.production = true;
    }
    const edit = this.router.snapshot.queryParams['edit'];
    if (edit) {
      this.currentTab = OrganizationSettingTabs.LOCATIONS;
    }

   }
}