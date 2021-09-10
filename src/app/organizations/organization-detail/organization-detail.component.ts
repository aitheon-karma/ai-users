import { FilesService, File } from './../../files/shared';
import { AuthService } from '@aitheon/core-client';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder} from '@angular/forms';
import { OrganizationsService, Organization } from './../shared';
import { Address } from '../../shared/Location';
import { ServicesService, Service } from './../../services/shared';
import { TeamsService, Team } from '../../teams/shared';
import { User, UsersService } from './../../users/shared';
import { BsModalRef } from 'ngx-bootstrap/modal';
@Component({
  selector: 'fl-organization-detail',
  templateUrl: './organization-detail.component.html',
  styleUrls: ['./organization-detail.component.scss']
})
export class OrganizationDetailComponent implements OnInit {
  currentTab: string = null;
  modalRef: BsModalRef;
  loading = false;
  editMode = false;
  submitted = false;
  servicesCollapsed = false;
  organization: Organization;
  address: Address;
  services: Service[];
  teams: Team[];
  users: User[];
  invites: User[];
  organizations: Organization[];
  activeParent: any;
  files: File[];
  error: any;
  editOrgModalRef: BsModalRef;

  constructor(
    private fb: FormBuilder,
    private organizationsService: OrganizationsService,
    private servicesService: ServicesService,
    private teamsService: TeamsService,
    private usersService: UsersService,
    private filesService: FilesService,
    private authService: AuthService,
    private activatedRoute: ActivatedRoute) { }

  get isNew() {
    return this.organization && !this.organization._id;
  }

  setActiveParent() {
    if (!this.organization) {
      return null;
    }
    const parent = this.organization.parent;
    const org = this.organizations ? this.organizations.find((o: Organization) => o._id === parent) : null;
    if (!org) {
      return this.activeParent = null;
    }
    this.activeParent = org;
  }

  ngOnInit() {
    this.loading = true;

    this.authService.activeOrganization.subscribe((organization: Organization) => {
      this.organization = organization;
      this.loading = false;
      if (this.isNew) {
        this.editMode = true;
      }
      this.loadTeams(organization._id);
      this.loadUsers(organization._id);
      this.loadInvites(organization._id);
      this.loadOrganizations();
      this.loadFiles(organization._id);
    });
    this.loadServices();

    this.activatedRoute.params.subscribe(({tab}) => {
      this.currentTab = tab;
    });
  }

  loadFiles(organizationId: string) {
    this.filesService.list(organizationId).subscribe((files: File[]) => {
      this.files = files;
    });
  }

  loadOrganizations() {
    this.organizationsService.list().subscribe((organizations: Array<Organization>) => {
      this.organizations = organizations.filter((o: Organization) => o._id !== this.organization._id);
      this.setActiveParent();
    });
  }

  loadServices(): void {
    this.servicesService.list().subscribe((services: Service[]) => this.services = services.filter((s: any) => !s.core));
  }

  loadTeams(organizationId: string): void {
    this.teamsService.list(organizationId).subscribe((teams: Team[]) => this.teams = teams);
  }

  loadUsers(organizationId: string): void {
    this.usersService.list(organizationId).subscribe((users: User[]) => this.users = users);
  }

  loadInvites(organizationId: string): void {
    this.usersService.listInvites(organizationId).subscribe((invites: User[]) => this.invites = invites);
  }


  toggleServices(): void {
    this.servicesCollapsed = !this.servicesCollapsed;
  }

  onFormCanceled(): void {
    this.editMode = false;
    this.modalRef.hide();
  }

  onServicesChanged(): void {
    this.authService.loadServices();
  }

  handleError(response: any) {
    try {
      response = JSON.parse(response);
      response = response.message;
    } catch (err) { }
     this.error = response;
  }
}
