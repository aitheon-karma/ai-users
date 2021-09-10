import { UsersService, User } from './../../../users/shared';
import { Component, OnInit, AfterViewInit, OnDestroy, Input, ViewChild, Output, EventEmitter } from '@angular/core';
import { Service } from './../service';
import { OrganizationsService } from './../../../organizations/shared/organizations.service';
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';
import { ToastrService } from 'ngx-toastr';
import {ServicesService} from '../services.service';
import { Subscription } from 'rxjs';

class ServiceRole {
  service: Service;
  enabled: boolean;
  role?: string;
}

interface OrganizationService {
  service: Service,
  enabled: boolean,
  role?: string
}

@Component({
  selector: 'fl-services-list',
  templateUrl: './services-list.component.html',
  styleUrls: ['./services-list.component.scss']
})
export class ServicesListComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('dialog') private swalDialog: SwalComponent;

  @Input() services: Service[];
  @Input() user: User;
  @Input() organizationId: string;
  @Input() personal = false;

  @Input() enabledService: Array<string>;
  @Input() servicesRoles: Array<{ role: string, service: string }>;

  @Output() servicesChanged: EventEmitter<any> = new EventEmitter<any>();

  get rolebased() {
    return this.servicesRoles != null;
  }

  cbPrefix: string = 'sl-' + new Date().getTime();

  orgServices: Array<{ service: Service, enabled: boolean, role?: string }>;

  roles: Array<string>;
  config = {
    search: false,
    limitTo: 10
  };

  private subscriptions$: Subscription = new Subscription();

  constructor(
    private toastr: ToastrService,
    private organizationsService: OrganizationsService,
    private usersService: UsersService,
    private servicesService: ServicesService
  ) { }

  ngOnInit() {
    this.roles = ['ServiceAdmin', 'User'];

    this.fetchAvailableServices();
  }

  ngAfterViewInit(): void {
    // @ts-ignore
    this.swalDialog.type = 'warning';
    this.swalDialog.swalOptions = {
      confirmButtonText: 'Yes, enable all',
      title: 'These services will be enabled:',
      buttonsStyling: false,
      // @ts-ignore
      confirmButtonClass: 'btn btn-primary ripple-effect mr-4',
      cancelButtonClass: 'btn btn-secondary ripple-effect',
      showCancelButton: true
    };
  }

  ngOnDestroy() {
    this.subscriptions$.unsubscribe();
  }

  searchServiceDependencies(orgSrv: { service: Service, enabled: boolean, role?: string }) {
    let dependencies = this.orgServices.filter((s: { service: Service, enabled: boolean, role?: string }) => {
      return orgSrv.service.dependencies.includes(s.service._id);
    });
    dependencies.forEach((s: { service: Service, enabled: boolean, role?: string }) => {
      if (s.service.dependencies.length > 0) {
        const dp = this.searchServiceDependencies(s);
        dependencies = dependencies.concat(dp);
      }
    });
    return dependencies;
  }

  searchDependOn(orgSrv: { service: Service, enabled: boolean, role?: string }) {
    let dependencies = this.orgServices.filter((s: { service: Service, enabled: boolean, role?: string }) => {
      return s.service.dependencies.includes(orgSrv.service._id);
    });
    dependencies.forEach((s: { service: Service, enabled: boolean, role?: string }) => {
      if (s.service.dependencies.length > 0) {
        const dp = this.searchDependOn(s);
        dependencies = dependencies.concat(dp);
      }
    });
    return dependencies;
  }

  onEnableChangeEvent(event: any, item: ServiceRole) {

    item.enabled = false;
  }

  onEnableChange(item: ServiceRole, event: any): void {
    const newValue = !item.enabled;
    event.preventDefault();
    event.stopPropagation();


    if (item.service.dependencies.length > 0 && newValue) {

      this.swalDialog.swalOptions = {
        confirmButtonText: 'Yes, enable all',
        title: 'Dependencies services will be enabled.',
        buttonsStyling: false,
        // @ts-ignore
        confirmButtonClass: 'button button--contained button--medium mr-5',
        cancelButtonClass: 'button button--ghost button--medium',
        showCancelButton: true
      };

      let allDependencies = this.searchServiceDependencies(item);

      // File all dependencies and keep only that is current is disabled to show dialog with required enable action
      allDependencies = allDependencies.filter((dep: { service: Service, enabled: boolean, role?: string }) => {
        return this.orgServices.findIndex((current: { service: Service, enabled: boolean, role?: string }) => {
          return dep.service._id === current.service._id && !current.enabled;
        }) > -1;
      });

      // again check if we have any dependencies and show only if need any
      if (allDependencies.length > 0) {
        const list = allDependencies.map((s: any) => `<li>${s.service.name}</li>`).join('');
        this.swalDialog.html = `
        <ul class="swal-srv-dependencies">
          ${list}
        </ul>
        `;
        this.swalDialog.fire().then((result) => {


          if (result.value == true) {
            this.changeAction(item, newValue);
            allDependencies.forEach((s: { service: Service, enabled: boolean, role?: string }) => {
              s.role = item.role;
              this.changeAction(s, newValue);
            });
          }

        }, () => { });
        return;
      }
    }


    // Here check if some service depend on this
    let dependOnThisService = this.searchDependOn(item);
    // File all dependencies and keep only that is current is enabled to show dialog with required disable action
    dependOnThisService = dependOnThisService.filter((dep: { service: Service, enabled: boolean, role?: string }) => {
      return this.orgServices.findIndex((current: { service: Service, enabled: boolean, role?: string }) => {
        return dep.service._id === current.service._id && current.enabled;
      }) > -1;
    });

    if (!newValue && dependOnThisService.length > 0) {

      this.swalDialog.swalOptions = {
        confirmButtonText: 'Yes, disable all',
        title: 'Dependencies to be disabled.',
        buttonsStyling: false,
        // @ts-ignore
        confirmButtonClass: 'btn btn-primary ripple-effect mr-4',
        cancelButtonClass: 'btn btn-secondary ripple-effect',
        showCancelButton: true,
      };

      const list = dependOnThisService.map((s: any) => `<li>${s.service.name}</li>`).join('');
      this.swalDialog.html = `
      <ul class="swal-srv-dependencies">
        ${list}
      </ul>`;
      this.swalDialog.fire().then((result) => {


        if (result.value == true) {
          this.changeAction(item, newValue);
          dependOnThisService.forEach((s: { service: Service, enabled: boolean, role?: string }) => {
            s.enabled = newValue;
            s.role = item.role;
            this.changeAction(s, newValue);
          });
        }

      }, () => { });
      return;
    }

    // search if any other service is depend on this service and show disabele for them TooltipModule
    this.changeAction(item, newValue);

  }

  changeAction(item: ServiceRole, action: boolean) {
    if (this.personal) {
      if (action) {
        this.usersService.addService(item.service._id).subscribe(() => {
          item.enabled = action;
          if (this.servicesChanged.observers.length > 0) {
            this.servicesChanged.emit();
          }
        }, (error) => this.handleError(error));
      } else {
        this.usersService.removeService(item.service._id).subscribe(() => {
          item.enabled = action;
          if (this.servicesChanged.observers.length > 0) {
            this.servicesChanged.emit();
          }
        }, (error) => this.handleError(error));
      }
    } else {
      if (!this.rolebased) {
        if (action) {
          this.organizationsService.addService(this.organizationId, item.service._id).subscribe(() => {
            item.enabled = action;
            if (this.servicesChanged.observers.length > 0) {
              this.servicesChanged.emit();
            }
          }, (error) => this.handleError(error));
        } else {
          this.organizationsService.removeService(this.organizationId, item.service._id).subscribe(() => {
            item.enabled = action;
            if (this.servicesChanged.observers.length > 0) {
              this.servicesChanged.emit();
            }
          }, (error) => this.handleError(error));
        }
      } else {
        item.enabled = action;
        if (item.enabled) {
          this.servicesRoles.push({ service: item.service._id, role: item.role });
        } else {
          const index = this.servicesRoles.findIndex((s: { role: string, service: string }) => s.service === item.service._id);
          this.servicesRoles.splice(index, 1);
        }
        if (this.servicesChanged.observers.length > 0) {
          this.servicesChanged.emit();
        }
      }
    }

  }

  handleError(response: any) {
    try {
      response = JSON.parse(response);
      response = response.message;
    } catch (err) {
    }
    this.toastr.error(`${response} `, `Error`);
  }

  roleChange(item: ServiceRole) {
    const service = this.servicesRoles.find((s: { role: string, service: string }) => s.service === item.service._id);
    if (service) {
      service.role = item.role;
    }
  }

  private fetchAvailableServices(): void {
    this.subscriptions$.add(
      this.servicesService.listByOrganization(this.organizationId)
        .subscribe(enabledOrganizationServices => {
          const defaultRole = 'User';

          if (this.personal) {
            this.orgServices = this.getPersonalServices();
          } else {
            this.orgServices = this.rolebased
              ? this.getServicesForOrganization(defaultRole)
              : this.getServicesForOrganization();
          }

          this.orgServices = this.getFilteredAvailableServices(this.orgServices, enabledOrganizationServices);
        })
    );
  }

  private getServicesForOrganization(defaultRole?: string): Array<OrganizationService> {
    const isRoleBased = defaultRole && defaultRole.length > 0;

    return this.services.map((service: Service) => {
      const srvRole = isRoleBased
        ? this.servicesRoles.find((s: { role: string, service: string }) => s.service === service._id)
        : null;
      const enabled = isRoleBased ? (srvRole != null) : !!this.enabledService?.includes(service._id);

      if (isRoleBased) {
        const role = srvRole ? srvRole.role : defaultRole;

        return { service: service, enabled: enabled, role: role };
      } else {
        return { service: service, enabled: enabled };
      }
    });
  }

  private getPersonalServices(): Array<OrganizationService> {
    return this.services.map((service: Service) => {
      const enabled = this.user.services.includes(service._id);
      return { service: service, enabled: enabled };
    });
  }

  private getFilteredAvailableServices(allServices: OrganizationService[], enabledServices: string[]): Array<OrganizationService> {
    return allServices.filter(service => {
      return enabledServices.find(enabledService => enabledService === service.service._id);
    });
  }
}
