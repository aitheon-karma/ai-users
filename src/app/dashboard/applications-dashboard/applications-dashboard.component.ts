import { ApplicationBuildService, AuthService, GraphRefType, ModalService, ApplicationsService, ApplicationType, ReferenceType } from '@aitheon/core-client';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { take, switchMap, delay } from 'rxjs/operators';
import { DashboardService } from '../shared';

@Component({
  selector: 'ai-applications-dashboard',
  templateUrl: './applications-dashboard.component.html',
  styleUrls: ['./applications-dashboard.component.scss']
})
export class ApplicationsDashboardComponent implements OnInit, OnDestroy {
  @Input() isServiceDashboard: boolean;

  private subscriptions$ = new Subscription();
  selectedApplication: any;
  applications: any[];
  isLoading = true;
  graphUrl: string;
  serviceKey = 'USERS';
  public isAppsDropdownOpened: boolean;
  private selectedApplicationId: string;

  constructor(
    public authService: AuthService,
    public modalService: ModalService,
    private applicationBuildService: ApplicationBuildService,
    private dashboardService: DashboardService,
    private applicationsService: ApplicationsService
  ) {}

  ngOnInit() {
    this.getDashboardApplications();
  }

  openApplicationsFlowModal() {
    this.modalService.openModal('AUTOMATE_MODAL', {
      type: ApplicationType.DASHBOARD,
      reference: this.serviceKey,
      referenceType: GraphRefType.SERVICE,
      existing: this.applications?.map(app => app?.project?._id) || [],
    });
  }

  getDashboardApplications(): void {
    let request$ = this.dashboardService.getOrgGraphApplications(ApplicationType.DASHBOARD);
    this.subscriptions$.add(request$.subscribe(graphData => {
        this.applications = graphData?.applications;
        this.checkForSelectedApp();
        if (graphData?.graphId) {
          this.graphUrl = `/system-graph/graphs/organization/service/USERS/sub-graph/${graphData?.graphId}`;
        }
        this.isLoading = false;
        this.applicationBuildService.setBuildStatus$(null);
      },
      () => {
        this.isLoading = false;
        this.applicationBuildService.setBuildStatus$(null);
      }));
  }

  public toggleAppsDropdown(): void {
    this.isAppsDropdownOpened = !this.isAppsDropdownOpened;
  }

  onCreateNode(e: { name: string; type: any }) {
    const data = {
      name: e.name,
      service: this.serviceKey,
      type: e.type,
      subType: ApplicationType.DASHBOARD,
    } as any;
    this.applicationBuildService.createApplication(data);
    this.onBuildFinish();
  }

  onBuildFinish() {
    this.applicationBuildService.buildFinished$.pipe(take(1)).subscribe(() => {
      this.getDashboardApplications();
    });
  }

  onEditDashboardApp(): void {
    this.applicationBuildService.editApplication(this.selectedApplication.project?._id);
    this.onBuildFinish();
  }

  deployDashboardApp(graphNodes: any[]): void {
    if (graphNodes) {
      const [dashboardNode] = graphNodes;
      if (dashboardNode) {
        this.isLoading = true;
        this.applicationsService.deployNode({ graphNodeId: dashboardNode?._id, publish: true })
          .pipe(
            delay(300),
            switchMap(this.getDashboardApplications.bind(this)),
          ).subscribe();
      }
    }
  }

  onDeleteDashboardApplication(graphNodeId: string): void {
    this.isLoading = true;
    this.getDashboardApplications();
  }

  private checkForSelectedApp(): void {
    if (this.applications?.length) {
      let application;
      if (this.selectedApplicationId) {
        application = this.applications.find(({ graphNodeId }) => graphNodeId === this.selectedApplicationId);
      }
      if (!application) {
        application = this.applications[0];
      }
      this.selectApplication(application);
    } else {
      this.selectedApplicationId = null;
      this.selectedApplication = null;
    }
  }

  public selectApplication(application: any): void {
    this.selectedApplicationId = application?.graphNodeId;
    this.selectedApplication = application;
  }

  public goToCore(): void {
    if (this.graphUrl) {
      window.open(this.graphUrl, '_blank');
    }
  }

  ngOnDestroy() {
    try {
      this.subscriptions$.unsubscribe();
    } catch (e) {
    }
  }
}
