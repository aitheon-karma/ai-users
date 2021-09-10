import {
  Component,
  OnInit,
  OnChanges,
  Input,
  SimpleChanges,
  Output,
  EventEmitter,
} from '@angular/core';
import { AuthService } from '@aitheon/core-client';
import { ServicesService } from 'app/services/shared';
import { OrganizationsService } from '../../organizations/shared';
import { ToastrService } from 'ngx-toastr';

// tslint:disable-next-line:import-blacklist
import { forkJoin } from 'rxjs';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'ai-services-map',
  templateUrl: './services-map.component.html',
  styleUrls: ['./services-map.component.scss']
})
export class ServicesMapComponent implements OnInit, OnChanges {
  @Input() activeOrg: any;
  @Input() isHidden = true;
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onServiceEnable: EventEmitter<any> = new EventEmitter<any>();
  // tslint:disable-next-line:no-output-on-prefix
  @Output() onConfigureService: EventEmitter<any> = new EventEmitter<any>();
  @Output() toggleServiceMap: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() automateConfirm: EventEmitter<any> = new EventEmitter<any>();

  user: any;
  userOwner = false;
  allServices: any;
  coreServices = new Array<string>();
  isAdminUser = false;
  loading: boolean;
  activeService: any;

  services = [
    {
      name: 'sales',
      title: 'Sales',
      descriptionTitle: 'Sales',
      _id: 'SALES',
      price: 'Our price per user: $0.2 / hour',
      description: 'Aitheon’s AI Sales tool empowers sales managers to automate and drive their teams effectively. Managers can ' +
        'customize the workflow of the sales process to help their sales teams increase productivity and meet goals.',
      status: '',
      url: 'sales'
    },
    {
      name: 'marketplace',
      title: 'Marketplace',
      descriptionTitle: 'Marketplace',
      _id: 'MARKETPLACE',
      price: 'Our price per user: $0.2 / hour',
      description: 'Sell your products, this is a full e-commerce store for your products. Selling online with your own ecommerce' +
        ' website has never been easier, faster, or more scalable.',
      status: '',
      url: 'marketplace'
    },
    {
      name: 'oms',
      title: 'Order Management',
      descriptionTitle: 'Order Management',
      _id: 'OMS',
      price: 'Our price per user: $0.25 / hour',
      description: 'The order management system allows management of order processing in real-time from the moment an order is ' +
        'placed until it is delivered to your customer, ensuring on-time delivery and an excellent experience to the customer.',
      status: '',
      url: 'oms'
    },
    {
      name: 'projectManagement',
      title: 'Project Management',
      descriptionTitle: 'Project Management',
      _id: 'PROJECT_MANAGER',
      price: 'Our price per user: $0.2 / hour',
      description: 'Aitheon’s Project Manager combines the best features of leading project management tools with a powerful' +
        ' AI engine to help increase staff productivity and accountability.  Aitheon’s project manager gives a clear scope of tasks,' +
        ' control over deadlines and accountability to give Project Managers complete control over a project in real-time.',
      status: '',
      url: 'project-manager'
    },
    {
      name: 'infrastructure',
      title: 'Buildings',
      descriptionTitle: 'Smart infrastructure',
      type: 'BUILDING',
      _id: 'SMART_INFRASTRUCTURE',
      price: 'Our price per user: $0.28 / hour',
      description: 'All of your infrastructure facilities, business processes, and devices connected to an operational overview. Delegate tasks and monitor performance throughout all your work areas in Smart Infrastructure.',
      status: '',
      url: 'smart-infrastructure'
    },
    {
      name: 'warehouse',
      title: 'Warehouses',
      descriptionTitle: 'Smart infrastructure',
      _id: 'SMART_INFRASTRUCTURE',
      type: 'WAREHOUSE',
      price: 'Our price per user: $0.28 / hour',
      description: 'All of your infrastructure facilities, business processes, and devices connected to an operational overview. Delegate tasks and monitor performance throughout all your work areas in Smart Infrastructure.',
      status: '',
      url: 'smart-infrastructure'
    },
    {
      name: 'manufacture',
      title: 'Factories',
      descriptionTitle: 'Smart infrastructure',
      type: 'FACTORY',
      _id: 'SMART_INFRASTRUCTURE',
      price: 'Our price per user: $0.28 / hour',
      description: 'All of your infrastructure facilities, business processes, and devices connected to an operational overview. Delegate tasks and monitor performance throughout all your work areas in Smart Infrastructure.',
      status: '',
      url: 'smart-infrastructure'
    },
    {
      name: 'items',
      title: 'Items',
      descriptionTitle: 'Items',
      _id: 'ITEM_MANAGER',
      price: 'Our price per user: $0.2 / hour',
      description: 'The Item Manager is the centralized location of items, related files, information and inventory, that are used ' +
        'in your business. These items are used throughout the platform eliminating duplications and can be enabled into a web ' +
        'shopping cart. The items are connected to the warehouse allowing you to easily identify where the needed item is stored as the' +
        ' system is instantly updating and maintaining information regarding the stock and inventory items.',
      status: '',
      url: 'item-manager'
    },
    {
      name: 'drive',
      title: 'Drive',
      descriptionTitle: 'Drive',
      _id: 'DRIVE',
      price: 'first 50 GB free 0.05/GB after',
      description: 'Save and store your company information in a safe collaborative place for your team. With advanced permissions,' +
        ' sharing and encryption controls you can securely manage your organizations confidential information with ease.',
      status: '',
      url: 'drive'
    },
    {
      name: 'hr',
      title: 'HR Service',
      descriptionTitle: 'HR Service',
      _id: 'HR',
      price: 'Our price per user: $0.2 / hour',
      description: 'Aitheon’s HR Manager simplifies and eliminates manual work by automating all HR tasks.  It provides a high level ' +
        'of security for your business with paperless employee onboarding and electronic storage of all sensitive HR documents.' +
        ' The HR dashboard displays the cost of employees, HR task deadlines and all HR reporting in real-time.',
      status: '',
      url: 'hr'
    },
    {
      name: 'treasury',
      title: 'Treasury',
      descriptionTitle: 'Treasury',
      _id: 'TREASURY',
      price: 'now For Free',
      description: 'Treasury brings automation to your Bank and crypto accounts. Using real time transaction history and payment systems,' +
        ' your organization can automate transaction data matching with your accounting data and payments.',
      status: '',
      url: 'treasury'
    },
    {
      name: 'accounting',
      title: 'Accounting',
      descriptionTitle: 'Accounting',
      _id: 'ACCOUNTING',
      price: 'Our price per user: $0.25 / hour',
      description: 'Aitheon’s Accounting component provides all the tools you need to manage your company’s finances. ' +
        ' Aitheon Accounting integrates all of your finance functions and  is constantly collecting and analyzing data giving you a ' +
        'real-time view of your company’s financial position.',
      status: '',
      url: 'accounting'
    },
    {
      name: 'procurement',
      title: 'Procurement',
      descriptionTitle: 'Procurement',
      _id: 'PROCUREMENT',
      price: 'Our price per user: $0.25 / hour',
      description: 'Automate the time consuming process of procurement with the AI Procurement tool. Receive the best available ' +
        'pricing for goods and services based on quality, quantity, time and location. With vast amounts of external data, new suppliers' +
        ' are identified while relationships with current suppliers are optimized.',
      status: '',
      url: '"procurement"'
    },
    {
      name: 'iot',
      title: 'IoT',
      descriptionTitle: 'IoT',
      _id: 'DEVICE_MANAGER',
      description: 'Take advantage of Internet of Things (IoT) smart devices and sensors, seamlessly integrating into your ' +
        'organization and processes.',
      status: '',
      url: 'device-manager'
    },
    {
      name: 'robotics',
      title: 'Robotics',
      descriptionTitle: 'Robotics',
      _id: 'DEVICE_MANAGER',
      description: 'Integrate robotics into your business with ease. With Aitheon Robot Manager, you can quickly deploy, manage,' +
        ' customize robot tasks and use Aitheon piloting services to automatically recover the robots when they run into issues.',
      status: '',
      url: 'device-manager'
    },
    {
      name: 'machines',
      title: 'Machines',
      descriptionTitle: 'Machines',
      _id: 'DEVICE_MANAGER',
      description: 'Integrate machines and production equipment into your business with ease and create smart factories and ' +
        'automated production workflows with your existing equipment.',
      status: '',
      url: 'device-manager'
    },
    {
      name: 'orchestrator',
      title: 'Orchestrator',
      descriptionTitle: 'Orchestrator',
      _id: 'ORCHESTRATOR',
      price: 'Our price per user: $0.25 / hour',
      status: '',
      url: 'orchestrator'
    },
    {
      name: 'requests',
      title: 'Requests',
      descriptionTitle: 'Requests',
      _id: 'REQUESTS',
      price: 'Our price per user: $0.2 / hour',
      status: '',
      url: 'requests'
    },
    {
      name: 'phone',
      title: 'Phones',
      descriptionTitle: 'Phones',
      _id: 'DEVICE_MANAGER',
      status: '',
      url: 'device-manager'
    },
    {
      name: 'camera',
      title: 'Cameras',
      descriptionTitle: 'Cameras',
      _id: 'DEVICE_MANAGER',
      status: '',
      url: 'device-manager'
    },
    {
      name: 'pilots',
      title: 'Pilots',
      descriptionTitle: 'Pilots',
      _id: 'DEVICE_MANAGER',
      price: 'Our price per user: $9.95 / hour',
      status: '',
      url: 'device-manager'
    },
    {
      name: 'creator',
      title: 'Creator Studio',
      descriptionTitle: 'Creator Studio',
      _id: 'CREATORS_STUDIO',
      price: '',
      description: 'Creators Studio allows users to easily create, change and support logic of business processes that control software and hardware, with both Full-Code and Graphical / Low-Code Experience versions available.',
      status: '',
      url: 'creators-studio'
    },
    {
      name: 'support',
      title: 'Customer Support',
      descriptionTitle: 'Customer Support',
      _id: 'CUSTOMER_SUPPORT',
      price: '',
      description: 'Customer Support service allows you to automate and improve every part of your customer support, utilizing the most advanced features of modern-day AI technologies and offering a genuinely unique combination of functions (chat support, ticketing system, processes optimization) in one easily integrable tool.',
      status: '',
      url: 'customer-support'
    },
  ];

  constructor(private authService: AuthService,
              private orgService: OrganizationsService,
              public toastr: ToastrService,
              private servicesService: ServicesService,
              private organizationsService: OrganizationsService) {
  }

  ngOnInit() {
    this.activeService = this.services.find(s => s.name === 'projectManagement');
  }

  ngOnChanges(changes: SimpleChanges) {

    if (changes.activeOrg && changes.activeOrg.currentValue) {

      this.authService.currentUser
        .subscribe((user: any) => {
          this.user = user;
          this.isAdminUser = this.user.envAccess !== 'PROD' || this.user.sysadmin === true;
          this.checkOwner();
        });


      forkJoin([this.servicesService.list(), this.organizationsService.listServiceSetups()]).subscribe((result: any) => {
        this.allServices = result[0];
        const setups = result[1];
        this.getCoreServices();
        this.checkStatus(setups);
      });
    }
  }

  checkOwner() {
    this.user.roles.forEach((user: any) => {
      if (this.activeOrg._id === user.organization._id && user.role !== 'User') {
        this.userOwner = true;
      }
    });
  }

  getCoreServices() {
    this.allServices.forEach((service: any) => {
      if (service.core) {
        this.coreServices.push(service._id);
      }
    });
  }

  checkStatus(setups: any[]) {
    const serviceSetups = setups.map(s => s.service);

    this.services.forEach((service: any) => {
      service.status = 'UNAVAILABLE';
      const serviceData = this.allServices.find(s => s._id === service._id);

      if (this.activeOrg.services.includes(service._id) || this.coreServices.includes(service._id)) {
        return service.status = 'enabled';
      }
      if (serviceData && serviceData.envStatus === 'PROD' && !serviceData.core) {
        // REMOVE when HR service will be not only for aitheon org
        if (serviceData._id === 'HR') {
          return service.status = 'UNAVAILABLE';
        }
        return service.status = 'disabled';
      }

      if (serviceSetups.includes(service._id)) {
        service.status = 'unconfigured';
      }

    });
  }

  chooseService(e: Event, service: any) {
    e.stopPropagation();
    e.preventDefault();

    if (this.userOwner || service.status === 'enabled') {
      this.activeService = service;
    }
  }

  enableService(activeService: any) {
    this.loading = true;
    this.orgService.activateService({service: activeService._id}, this.activeOrg._id).subscribe((res: any) => {
      if (res.service) {
        if (res.sericeSetup) {
          this.services = this.services.map((s: any) => {
            if (s._id === res.service._id) {
              s.status = 'unconfigured';
            }
            return s;
          });
        } else {
          this.services = this.services.map((s: any) => {
            if (s._id === res.service._id) {
              s.status = 'enabled';
            }
            return s;
          });
        }
        this.onServiceEnable.emit(res);
      }
      const timer = setTimeout(() => {
        this.loading = false;
      }, 3000);
      clearTimeout(timer);
    });
  }

  configureService(service) {

    if (!this.isAdminUser) {
      let requestInfo: {type: string, source: string} = {
        type: 'Automation request',
        source: 'dashboard'
      };

      return this.automateConfirm.emit({ user: this.user, service: service.title, requestInfo });
    }

    if (service._id === 'SMART_INFRASTRUCTURE' || service._id === 'DEVICE_MANAGER') {
      return window.location.href = `/system-graph/service-items/${service._id}?type=${service.type}`;
    }
    window.location.href = `/system-graph/graphs/organization/service/${service._id}`;
  }

  configureQuestions(activeService: any) {
    this.onConfigureService.emit(activeService);
  }

  onAutomateConfirm(activeService: any) {
    let requestInfo: {type: string, source: string} = {
      type: 'Early access',
      source: 'dashboard'
    };

    return this.automateConfirm.emit({user: this.user, service: activeService, requestInfo});
  }

  hideServiceMap(e: Event) {
    e.stopPropagation();
    e.preventDefault();
    this.isHidden = !this.isHidden;
    this.toggleServiceMap.emit(this.isHidden);
  }

  openCore() {
    window.open('/system-graph/graphs/organization', '_blank');
  }
}
