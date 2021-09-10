import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { DashboardService, Settings, News, Tutorial, CryptoSettings } from './shared';
import { ModalDirective, BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Widget, WidgetConfig } from 'app/dashboard/shared/widget';
import { ToastrService } from 'ngx-toastr';
import { DashboardSettings } from './shared/dashboard-settings';
import { GridsterConfig, GridsterItem, GridsterComponent } from 'angular-gridster2';
import { TutorialsService } from '../admin/admin-tutorials/shared/tutorials.service';
import { TutorialSettings } from '../admin/admin-tutorials/shared/tutorial-settings';
import { MediaFile } from '../admin/admin-tutorials/shared/media';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { GenericConfirmComponent } from '../shared/generic-confirm/generic-confirm.component';
import { AuthService } from '@aitheon/core-client';
import { AccountsRestService } from '@aitheon/treasury';
import { forkJoin } from 'rxjs';
import { first } from 'rxjs/operators';
import { QuestionTarget } from '../shared/questions/shared/question';
import { OrganizationsService } from '../organizations/shared';
import { ServicesService } from '../services/shared';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'fl-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class DashboardComponent implements OnInit {


  @ViewChild('addWidgetModal') addWidgetModal: ModalDirective;
  @ViewChild('welcomeVideoModal') welcomeVideoModal: ModalDirective;
  // @ViewChild('myPayments') myPayments: MyPaymentsComponent;
  @ViewChild('widgetGrid') widgetGrid: any;
  @ViewChild('genericConfirm') genericConfirm: GenericConfirmComponent;
  // @ViewChild('serviceModal') serviceModal: ServiceModalComponent;
  @ViewChild('Gridster') gridsterComponent: GridsterComponent;
  @ViewChild('questionsTemplate') questionsModal: ModalDirective;

  screenHeight: any;
  screenWidth: any;

  settings: Settings;
  cryptoSettings: CryptoSettings;
  news: News[];
  newsCount: Number;
  questionTarget = QuestionTarget.ORGANIZATION;

  tutorials: Tutorial[];
  gridRows = 60;
  gridColumns = 100;
  dashboardEnabled = false;
  saleActive = false;
  saleClosed = false;

  availableWidgets = [];
  allWidgets = [];
  showVideo = false;
  tutorialSettings: TutorialSettings;
  welcomeVideoFile: MediaFile;
  welcomeVideo: SafeResourceUrl;
  dashboardSettings: DashboardSettings;
  gridHeight: number;
  options: GridsterConfig;
  gridsterWidgets: Array<GridsterItem>;
  private _widgets = [];
  private _editMode: boolean;
  activeOrg: any;
  personalTrialBalance: number;
  organizationTrialBalance: number;
  modalRef: BsModalRef;
  selectedService: any;
  error: any;
  allServices: any[];
  isHidden: boolean = true;
  serviceModalOpen: boolean = false;

  set editMode(value: boolean) {
    this._editMode = value;
    if (this._widgets && this._widgets.length) {
      this._widgets.forEach(w => w.config.dragEnabled = value);
      this.options.api.optionsChanged();
    }
  }

  get editMode() {
    return this._editMode;
  }

  get widgets() {
    return this._widgets;
  }

  set widgets(widgets: any[]) {
    this._widgets = widgets.map(w => { w.config._id = w._id; return w; });
    this._configureGrid();
  }

  private readonly ROW_HEIGHT = 136;

  constructor(
    private toastr: ToastrService,
    private dashboardService: DashboardService,
    private tutorialsService: TutorialsService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private modalService: BsModalService,
    private organizationsService: OrganizationsService,
    private accountsService: AccountsRestService,
    private servicesService: ServicesService,
    private route: ActivatedRoute
  ) {}

  widgetPositionChange(item: WidgetConfig) {
    const widget = {...this.widgets.find(w => w._id === item._id)};
    if (!widget) { return; }
    this.dashboardService.saveWidget(widget).subscribe(w => {
      this._configureGrid();
    });
  }

  checkIntroVideo() {
    this.dashboardService.getDashboardSettings().subscribe((dashboardSettings: DashboardSettings) => {
      this.dashboardSettings = dashboardSettings;

      if (dashboardSettings && (!dashboardSettings.organization || (dashboardSettings.organization && dashboardSettings.isFirstCreated))) {
        this.showVideo = !dashboardSettings.skipWelcomeVideo;
        this.tutorialsService.listSettings().subscribe((settings: TutorialSettings) => {
          this.tutorialSettings = settings;
          if (settings) {
            this.welcomeVideoFile = dashboardSettings.organization ?
              this.tutorialSettings.organizationVideo : this.tutorialSettings.welcomeVideo;
            if (this.welcomeVideoFile && this.showVideo) {
              this.welcomeVideo = this.sanitizer.bypassSecurityTrustResourceUrl(this.welcomeVideoFile.url);
              this.welcomeVideoModal.show();
            }
          }
        });
      }

      this.isHidden = !(!dashboardSettings || !dashboardSettings.hideServiceMap);
    });
  }

  async ngOnInit() {
    const signupService = this.route.snapshot.queryParams['setupService'];

    if (signupService) {
      this.serviceModalOpen = true;
    }

    this.activeOrg = await this.authService.activeOrganization.pipe(first()).toPromise();

    this.dashboardService.get().subscribe((s: Settings) => {
      this.settings = s;

      this.navigateToOrgIfFirstLogin();
    }, (err) => {
      this.toastr.error(err);
    });

    this.dashboardService.getWidgets().subscribe((result: { widgets: Widget[], settings: DashboardSettings }) => {
      this.allWidgets = result.settings.allWidgets;
      //   .filter(w => [ 'treasuryAccounts', 'profileState'].includes(w.component));
      this.widgets = result.widgets;
      this.widgets.forEach(w => w.config.dragEnabled = false);

      // will be removed changed later
      this.availableWidgets = this.allWidgets.filter((w: any) => {
        return result.widgets.findIndex((w1: Widget) => w1.component === w.component) === -1;
      }, (err) => {
        this.toastr.error(err);
      });

      // Temporary code: will be removed soon
      if (!this.activeOrg) {
        this.availableWidgets = this.availableWidgets.filter(w => w.component !== 'my-organization');
        this.widgets = this.widgets.filter(w => w.component !== 'my-organization');
        this.widgets = this.widgets.filter(w => w.component !== 'my-organization');
      } else if (this.activeOrg) {
        this.availableWidgets = this.availableWidgets.filter(w => w.component !== 'create-organization');
        this.widgets = this.widgets.filter(w => w.component !== 'create-organization');
      }

      this.checkIntroVideo();

    }, (err) => {
      this.toastr.error(err);
    });

    // get trial balance info to display in treasury and org widget
    this.checkTrialBalances();

    this.servicesService.list()
      .subscribe((services) => {
        this.allServices = services;
      });

    const configService: string = this.route.snapshot.queryParamMap.get('configService');

    if (configService) {
      this.showQuestionsModal(configService);
    }
  }

  toggleEdit() {
    this.editMode = !this.editMode;
  }


  addWidget() {
    this.addWidgetModal.show();
  }

  closeAddWidget() {
    this.addWidgetModal.hide();
  }

  removeWidget(widget: Widget) {
    const index = this.widgets.findIndex((w: any) => w.component === widget.component);
    this.widgets.splice(index, 1);
    this._configureGrid();
    this.dashboardService.removeWidget(widget._id).subscribe(() => {
      this.toastr.success('Widget removed');
    });
    const avalableWidget = this.allWidgets.find((w: Widget) => w.component === widget.component);
    if (avalableWidget) {
      this.availableWidgets.push(avalableWidget);
    }
  }

  insertWidget(insertWidget: Widget) {
    const index = this.availableWidgets.findIndex((w: any) => w.component === insertWidget.component);
    this.availableWidgets.splice(index, 1);
    const widget = { ...insertWidget };
    delete widget._id;

    this.dashboardService.saveWidget(widget).subscribe(w => {
      w.config._id = w._id;
      this.widgets.push(w);
    });

    if (!this.availableWidgets.length) {
      this.addWidgetModal.hide();
    }
  }

  private _configureGrid() {
    const maxY = Math.max(...this.widgets.map(w => w.config.y));
    const maxYHeight = Math.max(...this.widgets.filter(w => w.config.y === maxY).map(w => w.config.rows));
    this.gridHeight = (maxY + maxYHeight + 1) * this.ROW_HEIGHT;
    this._configWidgetsOptions(100);
  }

  showCloseVideo() {
    this.genericConfirm.show({
      text: `If you close this video, it will no longer be available.`,
      headlineText: 'Are you sure you want to close it?',
      confirmText: 'Yes, close', cancelText: 'Cancel', callback: () => {
        this.closeVideo();
      }
    });
  }

  automateConfirm(result: { user: any, service: string, requestInfo: any }) {
    const { user, service, requestInfo } = result;
    const text =
      `Hi, ${user.profile.firstName} ${user.profile.lastName}! <br><br>
      Thank you for your interest in the additional abilities of our platform.
      If you would like to get early access to these services, please give us
      a brief description below about your business and we will be in touch with you shortly. <br><br>
      We look forward to taking your business to the next level!<br>`;

    this.genericConfirm.show({
      text,
      headlineText: this.getModalTitle(requestInfo),
      showInput: true,
      confirmText: 'Apply',
      cancelText: 'Cancel',
      callback: (description: string) => {
        this.sendFeatureRequest(service, description, requestInfo);
      }
    });
  }

  sendFeatureRequest(service: string, description: string, requestInfo: { type: string, source: string }) {
    this.dashboardService.sendFeatureRequest(service, description, requestInfo).subscribe(() => {
        this.toastr.success('Mail sent. Thank you!');
      },
      err => this.toastr.error('Mail not sent. Contact us.'));
  }

  closeVideo() {
    this.showVideo = false;
    this.dashboardService.skipWelcomeVideo(this.dashboardSettings._id).subscribe();
    this.welcomeVideoModal.hide();
  }

  private _configWidgetsOptions(rows: number) {
    this.options = {
      itemChangeCallback: this.widgetPositionChange.bind(this),
      displayGrid: 'none',
      maxCols: 2,
      minCols: 2,
      maxRows: rows,
      keepFixedHeightInMobile: true,
      compactType: 'compactUp',
      saveGridItemCalculatedHeightInMobile: true,
      gridType: 'fixed',
      useTransformPositioning: true,
      fixedColWidth: 604,
      fixedRowHeight: 120,
      margin: 16,
      pushItems: true,
    };
    if (this.options.api) {
      this.options.api.optionsChanged();
      this.options.api.resize();
    }
  }

  private checkTrialBalances() {
    forkJoin(this.accountsService.userTrialBalance(),
      this.accountsService.organizationTrialBalance())
      .subscribe(balances => {
        this.personalTrialBalance = balances[0].balance;
        this.organizationTrialBalance = balances[1].balance;
      }, err => {
        this.personalTrialBalance = 0;
        this.organizationTrialBalance = 0;
      });
  }

  private getModalTitle(requestInfo: { type: string, source: string }): string {
    const modalType = requestInfo.type;
    let modalTitle = '';

    if (modalType === 'Automation request') {
      modalTitle = 'Automate service';
    } else {
      modalTitle = 'Get early access';
    }

    return modalTitle;
  }

  onSkipSetup() {
    this.closeModal();
  }

  closeModal() {
    this.modalRef.hide();
  }

  showQuestionsModal(service: any) {
    this.selectedService = service;
    this.modalRef = this.modalService.show(this.questionsModal, { ignoreBackdropClick: true, keyboard: false });
  }

  onQuestionsSubmit() {
    this.organizationsService.updateServicesConfig([this.selectedService._id]).subscribe((o: any) => {
      this.organizationsService.removeServiceConfig(this.selectedService._id).subscribe();
      this.closeModal();
      const service = this.allServices.find((s => s._id === this.selectedService._id));
      if (service) location.href = service.url;
    }, (error) => this.handleError(error));
  }

  serviceEnable({ service, serviceSetup }) {
    if (serviceSetup) {
      this.showQuestionsModal(service);
    } else {
      location.href = service.url;
    }
  }

  handleError(response: any) {
    try {
      response = JSON.parse(response);
      response = response.message;
    } catch (err) {
    }
    this.error = response;
  }

  onToggleServiceMap(hideServiceMap: boolean) {
    this.isHidden = hideServiceMap;
    if (!this.dashboardSettings) return;

    this.dashboardService.toggleServiceMap(this.dashboardSettings._id, hideServiceMap).subscribe();
  }

  onCloseServiceModal() {
    this.serviceModalOpen = false;
  }

  private navigateToOrgIfFirstLogin(): void {
    const isFirstLogin = this.isFirstLogin();

    if (isFirstLogin) {
      this.navigateToOrg();
    }
  }

  private isFirstLogin(): boolean {
    const firstLoginItem = localStorage.getItem('firstLogin');

    return firstLoginItem ? JSON.parse(firstLoginItem).isFirstLogin : false;
  }

  private navigateToOrg(): void {
    const currentUser = JSON.parse(localStorage.getItem('current_user'));
    const organization = currentUser?.roles[0]?.organization;

    localStorage.removeItem('firstLogin');
    this.authService.navigateToOrg(organization);
  }
}
