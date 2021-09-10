import { NOTIFICATIONS_CONFIG, ChangesData } from './notifications-config';
import { FormGroup, FormBuilder, FormArray, AbstractControl } from '@angular/forms';
import { ServicesService } from 'app/services/shared';
import { OrganizationsService } from 'app/organizations/shared';
import { Component, OnInit, AfterViewInit, OnDestroy, HostListener, ViewChild, ElementRef } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { forkJoin, Subject } from 'rxjs';
import { NotificationsSettingsService } from '../shared/notifications-settings.service';
import { NotificationSettings, NotificationTypeSettingsService } from '../shared/notification-settings';
import { debounceTime } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { PushNotificationService } from '../../dashboard/shared/push-notification.service';
import { environment } from 'environments/environment';
import { isPrivateMode } from './incognito.service';

@Component({
  selector: 'fl-user-notifications',
  templateUrl: './user-notifications.component.html',
  styleUrls: ['./user-notifications.component.scss']
})
export class UserNotificationsComponent implements OnInit, AfterViewInit, OnDestroy {

  @HostListener('window:mousewheel', ['$event']) onMouseWheel(event) {
    if (event.target?.localName === 'fl-user-settings' ||
      event.target?.className.includes('settings-container') ||
      event.target?.className.includes('notifications__top') ||
      event.target?.className.includes('notifications__title')) {
      this.handleMousewheel(event);
    }
  }

  @ViewChild('organizationsList') organizationsList: ElementRef;

  iframeSrc: string;
  organizations: any[];
  editedOrganizations: any[];
  avatarColors = ['#E96058', '#ED9438', '#F5BA06', '#67B231',
                  '#1AC0C9', '#589BE9', '#6278C4', '#8C58E9',
                  '#CA58E9', '#F39ABA'];
  activeOrganization: string;
  activeService: string;
  isSettingsOpen: boolean = false;
  isServiceSettingsOpen: boolean = false;
  services: any[];
  enabledService = [
    'PROJECT_MANAGER',
    'MARKETPLACE',
    'SMART_INFRASTRUCTURE'
  ];
  loading: boolean = false;
  notificationsForm: FormGroup;
  browserSettingsLink: string;
  tooltipText = 'Copy to Clipboard!';
  settings: NotificationSettings[];
  isAllEmail: boolean;
  isAllPush: boolean;
  payload: any = {} as any;
  actionSubj = new Subject();
  pushSubscription: PushSubscription;
  accessNotificationsPermissions: string;
  isIncognito$: Promise<boolean>;

  private banner: HTMLElement;
  private isBannerHidden: boolean = false;

  get orgArray() {
    return this.notificationsForm.get('organizations') as FormArray;
  }

  constructor(
    private swPush: SwPush,
    private organizationsService: OrganizationsService,
    private servicesService: ServicesService,
    private notificationsSettingsService: NotificationsSettingsService,
    private pushNotificationService: PushNotificationService,
    private fb: FormBuilder,
    private toastr: ToastrService,
  ) { }

  ngOnInit() {
    this.loading = true;
    this.isIncognito$ = isPrivateMode();
    this.accessNotificationsPermissions = Notification.permission;
    if (this.accessNotificationsPermissions === 'granted') {
        this.swPush.subscription.subscribe((subscription: PushSubscription) => {
          this.pushSubscription = subscription;
        });
    }

    forkJoin([this.servicesService.list(), this.organizationsService.list(), this.notificationsSettingsService.list()])
      .subscribe(([services, organizations, settings]) => {
      this.services = services;
      this.organizations = organizations;

      this.settings = settings;

      this.organizations = this.organizations.map(org => {
        const orgSettings = this.settings.find((s: NotificationSettings) => s.organization === org._id);
        const result = {
          ...org,
          push: (orgSettings && orgSettings.push) ? orgSettings.push.enabled : false,
          email: (orgSettings && orgSettings.email) ? orgSettings.email.enabled : false,
          services: this.getFormServices(org, orgSettings)
        } as NotificationSettings;
        return result;
      });
      this.loading = false;
      this.buildForm();
    });

      const agent = window.navigator.userAgent.toLowerCase()
      switch (true) {
        case agent.indexOf('edge') > -1:
          this.browserSettingsLink = 'edge://settings/content/notifications';
          return 'edge';
        case agent.indexOf('opr') > -1 && !!(<any>window).opr:
          this.browserSettingsLink = 'opera://settings/content/notifications';
          return 'opera';
        case agent.indexOf('chrome') > -1 && !!(<any>window).chrome:
          this.browserSettingsLink = 'chrome://settings/content/notifications';
          return 'chrome';
        case agent.indexOf('firefox') > -1:
          this.browserSettingsLink = 'about:preferences#privacy';
          return 'firefox';
        case agent.indexOf('safari') > -1:
          return 'safari';
        default:
          return 'other';
      }
  }

  ngAfterViewInit() {
    this.banner = document.querySelector('ai-notifications-warning');

    if (this.banner && !this.isBannerHidden) {
      this.banner.style.display = 'none';
      this.isBannerHidden = true;
    }
  }

  ngOnDestroy() {
    if (this.banner && this.isBannerHidden) {
      this.banner.style.display = 'block';
      this.isBannerHidden = false;
    }
  }

  getFormServices(org: any, orgSettings: NotificationSettings): any {
    if (org.services && org.services.length) {
      const result = {} as any;
      org.services
        .filter(s => this.enabledService.includes(s) && this.services.find(item => item._id === s))
        .forEach(s => {
          const service = this.services.find(item => item._id === s);
          const settingsServiceEmail = (orgSettings && orgSettings.email) ? orgSettings.email.services.find(ser => ser.serviceId === s.toString()) || {} as NotificationTypeSettingsService
                                                                          : {} as NotificationTypeSettingsService;
          const settingsServicePush = (orgSettings && orgSettings.push) ? orgSettings.push.services.find(ser => ser.serviceId === s.toString()) || {} as NotificationTypeSettingsService
                                                                        : {} as NotificationTypeSettingsService;
          const actions = {} as any;
          NOTIFICATIONS_CONFIG[service._id].forEach((action: any) => {
            actions[action.key] = {
              label: action.label,
              key: action.key,
              email: settingsServiceEmail.actions ? settingsServiceEmail.actions.some(a => action.key == a) : false,
              push: settingsServicePush.actions ? settingsServicePush.actions.some(a => action.key == a) : false
            };
          });
          result[service._id] = {
            _id: service._id,
            name: service.name,
            image: service.image,
            email: settingsServiceEmail._id ? settingsServiceEmail.enabled : false,
            push: settingsServicePush.enabled || false,
            actions
          };
        });
      return result;
    }

    return [];
  }

  async askSubscription(): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.swPush.isEnabled) {
          reject('You need to use a newer browser');
        }

        const subscription = await this.swPush.requestSubscription({ serverPublicKey: environment.webPush.VAPID_PUBLIC });
        this.pushNotificationService.requestSubscription(subscription).subscribe(() => {
          this.pushSubscription = subscription;
          this.accessNotificationsPermissions = 'granted';
          this.toastr.success('Successfully subscribed');
          resolve(true);
        });
      }
      catch(err) {
        this.toastr.error(err.message || err);
        Notification.requestPermission().then((result: string) => {
          this.accessNotificationsPermissions = result;
        });
        resolve(false);
      }
    });
  }

  async buildForm() {

    this.notificationsForm = this.fb.group({
      organizations: this.fb.array(this.organizations.map(org => this.fb.group({
        name: org.name,
        id: org._id,
        organization: [org],
        email: [org.email],
        push: [org.push],
        services: this.fb.array((Object.keys(org.services) || []).map((service) => {
          return this.fb.group({
            name: org.services[service].name,
            id: org.services[service]._id,
            service: [org.services[service]],
            email: [org.services[service].email],
            push: [org.services[service].push],
            actions: this.fb.array((NOTIFICATIONS_CONFIG[service] || []).map(control => {
              return this.fb.group({
                label: [control.label],
                key: [control.key],
                email: { value: org.services[service]?.actions[control.key]?.email, disabled: !org.services[service].email},
                push: { value: org.services[service]?.actions[control.key]?.push, disabled: !org.services[service].push}
              })
            })),
          })
        })),
      }))),
    });

    this.orgArray.controls.forEach((control: AbstractControl) => {
      this.processChanges(control, 'org');
      this.processChanges(control.get('push'), 'value', 'push');
      this.processChanges(control.get('email'), 'value', 'email');
      const services = control.get('services') as FormArray;
      services.controls.forEach((serviceControl: AbstractControl) => {
        this.processChanges(serviceControl, 'service');
        this.processChanges(serviceControl.get('push'), 'value', 'push');
        this.processChanges(serviceControl.get('email'), 'value', 'email');
        const actionControls = serviceControl.get('actions') as FormArray;
        actionControls.controls.forEach((actionControl: AbstractControl) => {
          this.processChanges(actionControl, 'action');
          this.processChanges(actionControl.get('push'), 'value', 'push');
          this.processChanges(actionControl.get('email'), 'value', 'email');
        });
      });
    });

    this.actionSubj.pipe(debounceTime(500)).subscribe(async (data: ChangesData) => {
      this.payload = {} as any;
      // FLOW for asking allow browser notification after enable checkbox
      // if (data.type === 'push' && !this.pushSubscription) {
      //   const subscribed = await this.askSubscription();
      //   if (!subscribed) {
      //     if (data.action) {
      //     } else if (data.service) {
      //       const orgControl = this.orgArray.controls.find((control: AbstractControl) => {
      //         return control.value.id === data.org.id;
      //       });
      //       const services = orgControl.get('services') as FormArray;
      //       const serviceControl = services.controls.find((sc: AbstractControl) => {
      //         return sc.value.id === data.service.id;
      //       });
      //       serviceControl.patchValue({ [data.type]: !data.value }, { emitEvent: false });
      //     } else {
      //       const orgControl = this.orgArray.controls.find((control: AbstractControl) => {
      //         return control.value.id === data.org.id;
      //       });
      //       orgControl.patchValue({ [data.type]: !data.value }, { emitEvent: false });
      //     }
      //     return;
      //   };
      // }
      if (data.action) {
        this.onActionChanged(data);
      } else if (data.service) {
        this.onServiceChanged(data);
      } else {
        this.onOrgChanged(data, true);
      }
    });
  }

  processChanges(control: AbstractControl, value: string, type?: string) {
    control.valueChanges.subscribe((data: any) => {
      this.payload[value] = data;
      if (type) {
        this.payload['type'] = type;
      }
      this.actionSubj.next(this.payload);
    });
  }

  generateOrgDataToSave(organizations: any[]) {
    const result = organizations.map((orgData) => {
      const servicesData = this.getServicesDataToSave(orgData);
      return {
        organization: orgData.id,
        push: {
          enabled: orgData.push,
          services: servicesData.push
        },
        email: {
          enabled: orgData.email,
          services: servicesData.email
        },
      } as NotificationSettings;
    });
    this.notificationsSettingsService.updateOrgs({ data: result }).subscribe(() => {},
    err => {
      this.toastr.error('Error in saving');
      window.location.reload();
    });
  }

  getServicesDataToSave(orgData: any): { email: NotificationTypeSettingsService[], push: NotificationTypeSettingsService[] } {
    const result = {
      email: [] as NotificationTypeSettingsService[],
      push: [] as NotificationTypeSettingsService[]
    }
    orgData.services.forEach((service: any) => {
      result.email.push(this.generateActions(service, 'email'));
      result.push.push(this.generateActions(service, 'push'));
    });
    return result;
  }

  generateActions(service: any, type: string) {
    return {
      enabled: service[type],
      serviceId: service.id,
      actions: service.actions.filter(a => a[type]).map(a => a.key)
    } as NotificationTypeSettingsService;
  }

  getRandomColor(index: number) {
    return this.avatarColors[index % this.avatarColors.length];
  }

  async onOrgAllChanged(changes: boolean, type: string) {
    // FLOW for asking allow browser notification after enable checkbox
    // if (type === 'push' && !this.pushSubscription) {
    //   const subscribed = await this.askSubscription();
    //   if (!subscribed) {
    //     this.isAllPush = false;
    //     return;
    //   };
    // }
    this.orgArray.controls.forEach((control: AbstractControl) => {
      const data = {
        org: control.value,
        type,
        value: changes
      } as ChangesData;
      this.onOrgChanged(data, false);
    });
    this.generateOrgDataToSave(this.orgArray.value);
  }

  onOrgChanged(data: ChangesData, isGenerate: boolean) {
    const { org, type, value } = data;
    const orgControl = this.orgArray.controls.find((control: AbstractControl) => {
      return control.value.id === org.id;
    });
    orgControl.patchValue({ [type]: value }, { emitEvent: false });
    const services = orgControl.get('services') as FormArray;
    services.controls.forEach((serviceControl: AbstractControl) => {
      this.actionsControlChange(serviceControl, type, value);
    });
    if (isGenerate) {
      this.generateOrgDataToSave([orgControl.value]);
    }
  }

  onServiceChanged(data: ChangesData) {
    const { org, type, value, service } = data;
    const orgControl = this.orgArray.controls.find((control: AbstractControl) => {
      return control.value.id === org.id;
    });
    if (value) {
      orgControl.patchValue({ [type]: value }, { emitEvent: false });
    }
    const services = orgControl.get('services') as FormArray;
    const serviceControl = services.controls.find((sc: AbstractControl) => {
      return sc.value.id === service.id;
    });

    this.actionsControlChange(serviceControl, type, value);
    this.generateOrgDataToSave([orgControl.value]);
  }

  onActionChanged(data: ChangesData) {
    const orgControl = this.orgArray.controls.find((control: AbstractControl) => {
      return control.value.id === data.org.id;
    });
    this.generateOrgDataToSave([orgControl.value]);
  }

  actionsControlChange(serviceControl: AbstractControl, type: string, value: boolean) {
    serviceControl.patchValue({ [type]: value }, { emitEvent: false });
    const actionControls = serviceControl.get('actions') as FormArray;
    const actions = actionControls.value;
    const isActionExist = actions.some(a => a[type]);
    actionControls.controls.forEach((actionControl: AbstractControl) => {
      if (!isActionExist) {
        actionControl.patchValue({ [type]: value }, { emitEvent: false });
      }
      value ? actionControl.get(type).enable({ emitEvent: false }) : actionControl.get(type).disable({ emitEvent: false, onlySelf: true });
    });
  }


  getOrgAvatar(organization: any) {
    if (organization.profile && organization.profile.avatarUrl) {
      return organization.profile.avatarUrl;
    } else {
      return this.generateOrgAvatar(organization);
    }
  }

  generateOrgAvatar(organization: any) {
    const orgTitleArray = organization.name ? organization.name.split(' ') : '';
    if (orgTitleArray.length > 1) {
      return orgTitleArray[0][0].toUpperCase() + orgTitleArray[orgTitleArray.length - 1][0].toUpperCase();
    } else {
      return organization.name[0].toUpperCase() + organization.name[1].toUpperCase();
    }
  }

  toggleOrgSettings(organization: any) {
    if (this.activeOrganization !== organization._id) {
      this.isSettingsOpen = true;
      this.activeOrganization = organization._id;
    } else  {
      this.isSettingsOpen = false;
      this.activeOrganization = '';
    }

    this.isServiceSettingsOpen = false;
    this.activeService = '';
  }

  toggleServiceSettings(service: any) {
    if (this.activeService !== service._id) {
      this.isServiceSettingsOpen = true;
      this.activeService = service._id;
    } else  {
      this.isServiceSettingsOpen = false;
      this.activeService = '';
    }
  }

  getFormArray(form: any, key: string) {
    return form.get(key) as FormArray;
  }

  copySettingsLink(text: string) {
    let cb: HTMLInputElement = <HTMLInputElement>document.querySelector(".notifications__warning-link");
    cb.value = text;
    cb.style.display='block';
    cb.select();
    document.execCommand('copy');
    this.tooltipText = 'Copied!';
  }

  resetCopy() {
    this.tooltipText = 'Copy to Clipboard!';
  }

  public isWarning(): boolean {
    return !!document.querySelector('.notifications__warning-container');
  }

  private handleMousewheel(event): void {
    const isOnOrganizationsList = event.path.some(element => {
      return element.classList?.contains('organization__top') ||
        element.classList?.contains('notifications__organization') ||
        element.classList?.contains('notifications__org-list');
    });

    const isOrganizationListScrollable = this.organizationsList.nativeElement.scrollHeight > this.organizationsList.nativeElement.offsetHeight;

    if (!isOnOrganizationsList && isOrganizationListScrollable) {
      this.scrollOrganizationList(event.deltaY);
    }
  }

  private scrollOrganizationList(scrollTop: number): void {
    const currentScrollPosition = this.organizationsList.nativeElement.scrollTop;
    this.organizationsList.nativeElement.scrollTo({
      top: currentScrollPosition + scrollTop,
      left: 0
    });
  }

}
