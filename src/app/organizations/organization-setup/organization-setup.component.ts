import { AuthService, Cookie } from '@aitheon/core-client';
import { Component, OnInit, TemplateRef, ViewChild, HostListener } from '@angular/core';
import { Organization } from './../shared/organization';
import { ActivatedRoute, Router } from '@angular/router';
import { ServicesService, Service } from '../../services/shared';
import { ToastrService } from 'ngx-toastr';
import { OrganizationsService } from '../shared';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { QuestionTarget, Question } from '../../shared/questions/shared/question';
import { Answer } from '../../shared/questions/shared/answer';
import { QuestionsService } from '../../shared/questions/shared/questions.service';

@Component({
  selector: 'fl-organization-setup',
  templateUrl: './organization-setup.component.html',
  styleUrls: ['./organization-setup.component.scss']
})
export class OrganizationSetupComponent implements OnInit {

  organization: Organization;
  generalEditMode = true;
  allServices: Service[] = [];
  totalServices: Service[] = [];
  modalRef: BsModalRef;
  enabledServices: string[] = [];
  questionTarget: QuestionTarget = QuestionTarget.ORGANIZATION;
  isExternal = false;
  urlCurrentStep: any;
  oldOrg: any;
  newOrgId: any;
  orgDomain: any;

  @ViewChild('questionsTemplate') questionsRef: TemplateRef<any>;

  error: any;
  constructor(
    private servicesService: ServicesService,
    private toastr: ToastrService,
    private router: Router,
    private organizationsService: OrganizationsService,
    private modalService: BsModalService,
    private activatedRoute: ActivatedRoute,
    private authService: AuthService,
    private questionService: QuestionsService,
  ) { }

  currentStep = 1;
  ngOnInit() {

    this.isExternal = this.activatedRoute.snapshot.params['isExternal'];
    this.urlCurrentStep = this.activatedRoute.snapshot.params['currentStep'];
    const current = this.activatedRoute.snapshot.queryParams['currentStep'];
    if (current) {
      this.currentStep = +current;
    }
    this.oldOrg = this.activatedRoute.snapshot.params['oldOrg'];
    this.newOrgId = this.activatedRoute.snapshot.params['newOrgId'];
    this.orgDomain = this.activatedRoute.snapshot.params['orgDomain'];
    if (this.isExternal && this.urlCurrentStep == 5) {
      this.currentStep = 5;
    }

    if (!this.urlCurrentStep && this.isExternal) {
      this.currentStep = 4;
    }

    this.organization = new Organization();
    this.servicesService.list().subscribe(services => {
      this.allServices = services;
      this.totalServices = services;
    });

  }

  checkAnswers() {
    this.authService.activeOrganization.subscribe((org: Organization) => {
      this.organization = org;
      if (!org) {
        return this.relocateToDashboard();
      }

      this.questionService.listAnswers().subscribe((answers: Answer[]) => {
        const configuredAnswers = answers.filter(a => a.configured);
        if (configuredAnswers && configuredAnswers.length) {
          return this.relocateToDashboard();
        }
        setTimeout(() => {
          this.openModal();
        }, 300);
      });
    });
  }

  checkServices() {
    const setupService = localStorage.getItem('signup-service');
    this.enabledServices = setupService ? [setupService] : [];
  }

  relocateToDashboard() {
    const baseHost = Cookie.get('base_host');
    const setupService = localStorage.getItem('signup-service');
    let link = `${window.location.protocol}//${this.orgDomain ? this.orgDomain + '.' : '' }${baseHost}/users/dashboard`;
    if (setupService) {
      link = link + `?setupService=${setupService}`;
    }
    window.location.href = link;
  }

  openModal() {
    this.modalRef = this.modalService.show(this.questionsRef, { ignoreBackdropClick: true, keyboard: false });
  }



  onFormCanceled(): void {
    // this.editMode = false;
  }

  onFinish() {
    if (this.oldOrg) {
      const data = {
        'supplierId': this.oldOrg,
        'status': 'REQUESTED',
        'external': true
      };
       this.organizationsService.updateSupplierStatus(data).subscribe((Response) => {
         this.organizationsService.approveSupplier(this.oldOrg).subscribe((response) => {
          // window.location.href = `/users/dashboard`;
          // this.router.navigate(['/dashboard']);
          this.relocateToDashboard();
        },
          (err) => {
            this.toastr.error('Approve suppiler error:', err ? err : '');
          });
      },
        (err) => {
          this.toastr.error('Update suppiler status error:', err ? err : '');
        });

    } else {
      this.toastr.error('Orgnazation id not present');
    }
  }

  onGeneralFormSaved(organization: any) {
    const setupService = localStorage.getItem('signup-service');
    if (this.isExternal) {
      organization.services = [];
      delete organization._id;

      this.organizationsService.createForExternal(organization).subscribe((o: Organization) => {
        const baseHost = Cookie.get('base_host');
        const link = `${window.location.protocol}//${o.domain}.${baseHost}/users/organizations/setup/true/5/${this.isExternal}/${o._id}/${o.domain}`;
        window.location.href = link;
        this.toastr.success('Organization created');
      }, (error) => this.handleError(error));

    } else {
      const baseHost = Cookie.get('base_host');
      let link = `${window.location.protocol}//${organization.domain}.${baseHost}/users/dashboard`;
      if (setupService) {
        link = link + `?setupService=${setupService}`;
      }
      window.location.href = link;
    }
  }

  enableGeneralEditMode() {
    this.generalEditMode = true;
    this.currentStep = 1;
  }

  onServicesSaved(services: Array<{ enabled: boolean, service: Service }>) {

    const servicesIds = services.filter(s => {
      if (s.enabled) { return s; }
    }).map(s => s.service._id);

    this.authService.activeOrganization.subscribe((org: Organization) => {
      this.organization = org;
      if (!org) {
        return this.relocateToDashboard();
      }
      this.organization.services = [...servicesIds];
      this.organizationsService.update(this.organization).subscribe();
      this.questionService.listAnswers().subscribe((answers: Answer[]) => {
        const configuredAnswers = answers.filter(a => a.configured);
        if (configuredAnswers && configuredAnswers.length) {
          return this.relocateToDashboard();
        }
        setTimeout(() => {
          this.openModal();
        }, 300);
      });
    });

    this.enabledServices = servicesIds;
    this.currentStep = 3;

  }

  handleError(response: any) {
    try {
      response = JSON.parse(response);
      response = response.message;
    } catch (err) { }
    this.error = response;
  }

  onQuestionsSubmit(result: { answers: Answer[], questions: Question[] }) {
    this.modalRef.hide();

    this.organizationsService.updateServicesConfig(this.enabledServices).subscribe((o: Organization) => {
      // OLD flow for setup service
      // const setupService = localStorage.getItem('signup-service');
      // if (setupService) {
      //   const service = this.totalServices.find(s => s._id === setupService);
      //   localStorage.removeItem('signup-service');
      //   if (service) {
      //     return location.href = service.url;
      //   }
      // }
      const baseHost = Cookie.get('base_host');
      const link = `${window.location.protocol}//${o.domain}.${baseHost}:${window.location.port}/users/dashboard`;
      window.location.href = link;
    }, (error) => this.handleError(error));
  }


  @HostListener('window:popstate', ['$event'])
  onPopState(event: any) {
    if (this.modalRef) {
      this.modalRef.hide();
    }
  }
}
