import { Router } from '@angular/router';
import { UserRole } from './../users/shared/user-role';
import { User } from './../users/shared/user';
import { AuthService } from '@aitheon/core-client';
import { Component, OnInit } from '@angular/core';
import { OrganizationsService, Organization } from './shared';
import { environment } from 'environments/environment';

@Component({
  selector: 'fl-organizations',
  templateUrl: './organizations.component.html',
  styleUrls: ['./organizations.component.scss']
})
export class OrganizationsComponent implements OnInit {
  currentUser: User;
  organizations: Organization[];
  allowedRoles = ['Owner', 'SuperAdmin', 'OrgAdmin'];

  constructor(
    private authService: AuthService,
    private router: Router,
    private organizationsService: OrganizationsService) {
  }

  ngOnInit() {

    this.organizationsService.list().subscribe((organizations: Organization[]) => {
      this.authService.currentUser.subscribe((user: any) => {
        this.organizations = organizations;

        this.currentUser = user;
        this.currentUser.roles.forEach((r: UserRole) => {
          if (!this.allowedRoles.includes(r.role)) {
            this.organizations.splice(this.organizations.findIndex((o: Organization) => o._id === r.organization['_id']), 1);
          }
        });
      });
    });

  }

  navigateTo(organization: Organization): void {
    if (environment.production) {
    // tslint:disable-next-line:max-line-length
      const link = `${ window.location.protocol }//${ organization.domain }.${ this.authService.baseHost() }:${ window.location.port }/users/organizations/organization-detail`;
      window.location.href = link;
    } else {
      this.router.navigate(['/organizations/organization-detail']);
    }
  }

}
