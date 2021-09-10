import {Component, OnInit, Input, ViewChild, TemplateRef} from '@angular/core';
import { OrganizationsService, Organization } from '../../shared';
import { ToastrService } from 'ngx-toastr';
import { ServicesService, Service } from '../../../services/shared';
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { AuthService } from '@aitheon/core-client';


@Component({
  selector: 'fl-organization-services',
  templateUrl: './organization-services.component.html',
  styleUrls: ['./organization-services.component.scss']
})
export class OrganizationServicesComponent implements OnInit {
  @Input() organization: Organization;
  @ViewChild('dialog') private swalDialog: SwalComponent;
  @ViewChild('manageSubscriptionModal') manageSubscriptionModalTemplate: TemplateRef<any>;
  @ViewChild('paymentMethodModal') paymentMethodModalTemplate: TemplateRef<any>;

  allServices: Service[] = [];
  organizationID: string;
  orgServices: any[] = [];
  serviceDependencies: string;
  selectedService: any;
  avatarColors = ['#E96058', '#ED9438', '#F5BA06',
    '#67B231', '#1AC0C9', '#589BE9',
    '#6278C4', '#8C58E9', '#CA58E9',
    '#F39ABA'];
  members: any;
  error: any;
  imageModal = false;
  zoomedImgUrl: string;
  manageSubscriptionModal: BsModalRef;
  paymentMethodModal: BsModalRef;
  currentUser: any;
  activeServiceTab: string = '';
  disabledServicesNumber: number;

  constructor(
    private toastr: ToastrService,
    private servicesService: ServicesService,
    private orgService: OrganizationsService,
    private httpClient: HttpClient,
    private authService: AuthService,
    private modalService: BsModalService) { }

  ngOnInit() {
    this.organizationID = this.organization._id;
    this.getOrgServices();
  }

  getOrgServices() {
    let servicesArr = [];
    let selected_servicesArr = [];
    const services = [];
    let selected_services = [];

    const services$ = this.orgService.getOrgServices(this.organizationID);
    const members$ = this.orgService.getMembers(this.organizationID);
    const currentUser$ = this.authService.currentUser.pipe(take(1));

    forkJoin([services$, members$, currentUser$]).subscribe(result => {
      selected_services = result[0];
      this.members = result[1];
      this.currentUser = result[2];
      this.getCurrentOrgServices(this.members);

      this.servicesService.list().subscribe(organizationServices => {
        organizationServices = organizationServices.filter(s => this.filterServicesByEnvAccess(this.currentUser.envAccess, s.envStatus));
        for (let i = 0; i < organizationServices.length; i++) {
          const data = {
            name: organizationServices[i]._id,
            desc: organizationServices[i].description,
            dependencies: organizationServices[i].dependencies,
            core: organizationServices[i].core
          };
          services.push(data);
        }
        servicesArr = services;
        selected_servicesArr = selected_services;
        for (let i = 0; i < servicesArr.length; i++) {
          const desc = servicesArr[i].desc;
          const dependencies = servicesArr[i].dependencies;
          let checked = false;
          checked = selected_servicesArr.includes(servicesArr[i].name);
          const data = {
            service: servicesArr[i].name,
            checked: checked,
            description: desc,
            dependencies: dependencies,
            core: servicesArr[i].core,
            members: [],
            images: []
          };
          this.orgServices.push(data);
        }
        this.sortMembersByServices();
        this.getServiceImages();
        this.toggleServiceTab('enabled');

        this.disabledServicesNumber = this.getDisabledServicesNumber();
      });
    }, err => this.handleError(err));
  }

  filterServicesByEnvAccess(accessLevel: string, serviceEnvStatus: string): Boolean {
    let isAllowed = false;
    switch (accessLevel) {
      case 'PROD':
        if (serviceEnvStatus === 'PROD') isAllowed = true;
        break;
      case 'BETA':
        if (serviceEnvStatus === 'PROD' || serviceEnvStatus === 'BETA') isAllowed = true;
        break;
      case 'ALPHA':
        if (serviceEnvStatus === 'PROD' || serviceEnvStatus === 'BETA' || serviceEnvStatus === 'ALPHA') isAllowed = true;
        break;
    }
    return isAllowed;
  }

  updateOrganizationServices(data, add) {
    this.orgService.updateOrganizationServices(data, this.organizationID, add).subscribe((res: any) => {
        this.disabledServicesNumber = this.getDisabledServicesNumber();
        this.toggleServiceTab(this.activeServiceTab);
        this.toastr.success(add ? 'Service enabled' : 'Service disabled');
      },
      (err: any) => {
        this.toastr.error(err);
        data.checked = !data.checked;
      })
  }

  getServiceDependenciesNames(service: any) {
    const servicesDependency = [];
    for (let i = 0; i < service.dependencies.length; i++) {
      servicesDependency[i] = service.dependencies[i].replace('_', ' ');
    }

    return servicesDependency.join();
  }

  enableDependencyServices(service) {
    if (service.checked === true) {
      if (service.dependencies.length === 0) {
        this.updateOrganizationServices(service, service.checked === true);
      } else {
        this.serviceDependencies = this.getServiceDependenciesNames(service);
        this.swalDialog['type'] = 'warning';
        this.swalDialog.swalOptions = {
          confirmButtonText: 'Yes, enable all',
          title: 'These services will be enabled:',
          buttonsStyling: false,
          confirmButtonClass: 'button button--contained button--medium mr-3',
          cancelButtonClass: 'button button--ghost button--medium',
          showCancelButton: true,
          text: this.serviceDependencies
        } as any;

        this.swalDialog.fire().then((result) => {
          if (result.value == true) {
            this.updateOrganizationServices(service, service.checked === true);
            service.dependencies.forEach(dependElement => {

              this.orgServices.forEach(orgServiceElement => {

                if (dependElement == orgServiceElement.service) {
                  if (orgServiceElement.core != true) {
                    if (orgServiceElement.checked == false) {
                      orgServiceElement.checked = true;
                      this.updateOrganizationServices(orgServiceElement, service.checked === true);
                    }
                  }
                }
              });
            });
          } else {
            service.checked = false;
            return;
          }
        });

      }
    } else {
      const serviceArray = [];
      let hasDependencies = false;
      this.orgServices.forEach(serviceElement => {
        if (serviceElement.checked == true) {
          if (serviceElement.dependencies.includes(service.service)) {
            hasDependencies = true;
            serviceArray.push(serviceElement.service.replace('_', ' '));
            this.swalDialog['type'] = 'warning';
            this.swalDialog.swalOptions = {
              confirmButtonText: 'Yes, disable all',
              title: 'These service will be disabled:',
              buttonsStyling: false,
              confirmButtonClass: 'button button--contained button--medium mr-3',
              cancelButtonClass: 'button button--ghost button--medium',
              showCancelButton: true,
              text: serviceArray.join()
            } as any;

            this.swalDialog.fire().then((result) => {
              if (result.value == true) {
                serviceElement.checked = false;
                service.checked = false;

                this.updateOrganizationServices(serviceElement, service.checked === true);
                this.updateOrganizationServices(service, service.checked === true);
              } else {
                service.checked = true;
                return;
              }
            });
          }
        }
      });
      if (hasDependencies === false) {
        this.updateOrganizationServices(service, service.checked === true);
      }

    }
    this.selectedService = service;
  }

  goToMarket() {
    window.location.href = '/marketplace/dashboard?type=Services';
  }

  selectService(service: any) {
    service.images.forEach(image => {
      this.isFileExist(image);
    });

    if (service.dependencies.length > 0) {
      this.serviceDependencies = this.getServiceDependenciesNames(service);
    }

    this.selectedService = service;
  }

  getRandomColor(index: number) {
    return this.avatarColors[index % this.avatarColors.length];
  }

  getInitials(name) {
    return ((name).substr(0, 2)).toUpperCase();
  }

  getOtherAssignees(members: any) {
    let arr = [];
    members.slice(5).forEach((member: any) => {
      const fullName = member?.profile?.firstName + ' ' + member?.profile?.lastName;
      arr.push(fullName);
    });
    let editedArr = arr.join(', ');
    return editedArr
  }

  handleError(error: any) {
    this.error = error;
  }

  private sortMembersByServices() {
    this.orgServices.forEach(service => {
      this.members.forEach(member => {
        member.services.forEach(memberService => {
          if (memberService.service === service.service) {
            service.members.push(member);
          }
        })
      })
    });
  }

  private getCurrentOrgServices(members: any) {
    members.map(member => {
      member.roles.map(role => {
        if (role.organization === this.organizationID) {
          member['services'] = role.services;
        }
      });
    });
  }

  public fileExists(url: string): Observable<boolean> {
    return this.httpClient.get(url).pipe(map(() => true), catchError(() => of(false)));
  }

  isFileExist(image: any) {
    const img = new Image();
    img.src = image.path;
    img.onload = () => {
      return image.load = true;
    }
    img.onerror = () => {
      return image.load = false;
    }
  }

  getServiceImages() {
    this.orgServices.map(service => {
      for (let i = 1; i <= 3; i++) {
        const url = `assets/img/services/${service.service}/${i}.png`;
        service.images.push({
          path: url,
          load: false
        });
      }
    })
  }

  zoomImage(imageUrl: string) {
    this.zoomedImgUrl = imageUrl;
    this.imageModal = true;
  }

  openSubsModal() {
    this.manageSubscriptionModal = this.modalService.show(this.manageSubscriptionModalTemplate, { backdrop: 'static' });
  }

  closeSubsModal() {
    this.manageSubscriptionModal.hide();
  }

  closePaymentMethodModal() {
    this.paymentMethodModal.hide();
  }

  openPaymentMethodModal() {
    this.manageSubscriptionModal.hide();
    this.paymentMethodModal = this.modalService.show(this.paymentMethodModalTemplate, { backdrop: 'static' });
  }

  public toggleServiceTab(tabName: string): void {
      this.activeServiceTab = tabName;

      this.selectedService = this.orgServices.find(service => {
          return (tabName === 'enabled') ? (service.checked || service.core) : !service.checked;
      });

      this.selectService(this.selectedService);
  }

  private getDisabledServicesNumber(): number {
    return this.orgServices.reduce((accumulator, currentService) => {
      if (!currentService.checked && !currentService.core) {
        accumulator++;
      }
      return accumulator;
    }, 0);
  }
}
