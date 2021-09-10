import { Component, OnInit, Input, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import { OrganizationsService, Organization, ProjectType, ProjectsService, Project } from '../../shared';
import { ToastrService } from 'ngx-toastr';
import { ServicesService, Service } from '../../../services/shared';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';

@Component({
  selector: 'fl-organization-interfaces',
  templateUrl: './organization-interfaces.component.html',
  styleUrls: ['./organization-interfaces.component.scss']
})
export class OrganizationInterfacesComponent implements OnInit, OnDestroy {

  @Input() organization: Organization;
  @ViewChild('logsListModal') logsListModal: TemplateRef<any>;

  projects: Project[];
  isLoading = false;
  modalRef: BsModalRef;

  logsList: Array<any>;

  $getLogs: Subscription;
  refresher: any;
  refresherSeconds = 5;
  total: number;

  constructor(
    private toastr: ToastrService,
    private servicesService: ServicesService,
    private projectsService: ProjectsService,
    private modalService: BsModalService,
    private orgService: OrganizationsService) { }

  ngOnInit() {
    this.loadInterfaces();
  }

  ngOnDestroy(): void {
    this.clear();
  }

  clear() {
    if (this.$getLogs) {
      this.$getLogs.unsubscribe();
    }
    if (this.refresher) {
      clearTimeout(this.refresher);
    }
    this.logsList = [];
    this.total = 0;
  }

  openLogs(project: Project) {
    this.clear();
    this.modalRef = this.modalService.show(this.logsListModal, { class: 'modal-lg modal-logs' });
    this.modalService.onHidden.subscribe(() => {
      this.clear();
    });
    this.loadLogs(project);
  }

  loadLogs(project: Project) {
    this.$getLogs = this.projectsService.getLogs(project._id).subscribe((result: { total: number, data: Array<any> }) => {
      this.logsList = result.data;
      this.total = result.total;
      this.refresher = setTimeout(() => {
        this.loadLogs(project);
      }, 1000 * this.refresherSeconds);
    }, (err: any) => {
      this.toastr.error(err);
    });
  }

  hideModal() {
    this.modalRef.hide();
    this.clear();
  }

  loadInterfaces() {
    this.isLoading = true;
    this.projectsService.listByType(ProjectType.INTERFACE).subscribe((projects: Project[]) => {
      this.projects = projects.map((p: Project) => { p.checked = true; return p; });
    }, (err: any) => {
      this.toastr.error(err);
    });
  }

  // updateOrganizationServices(data) {
  //   this.orgService.updateOrganizationServices(data, this.organizationID).subscribe((res: any) => {
  //     this.toastr.success(res.message);
  //   });
  // }


}
