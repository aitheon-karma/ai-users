import { Component, OnInit, Renderer2, ViewChild, TemplateRef, AfterViewInit } from '@angular/core';
import { AuthService, TourGuideService } from '@aitheon/core-client';
import { environment } from 'environments/environment';
import { Router, ResolveEnd, NavigationEnd } from '@angular/router';
import { TourGuideStepRestService, TourGuideStep, TourGuideRestService, TourGuide } from '@aitheon/platform-support';
import * as introJs from 'intro.js/intro.js';
import { first } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { GenericConfirmComponent } from './shared/generic-confirm/generic-confirm.component';
import { BsModalService, BsModalRef, ModalDirective } from 'ngx-bootstrap/modal';
import { QuestionTarget, servicesToEnableFromAnswers, Question } from './shared/questions/shared/question';
import { Organization } from './organizations/shared/organization';
import { ServicesService, Service } from './services/shared';
import { Answer } from './shared/questions/shared/answer';
import { OrganizationsService } from './organizations/shared';
import { QuestionsService } from './shared/questions/shared/questions.service';
import { forkJoin } from 'rxjs';
import { Cookie } from '@aitheon/core-client';

const ONBOARDING_KEY = 'onboarding';

@Component({
  providers: [],
  selector: 'fl-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  @ViewChild('genericConfirm') genericConfirm: GenericConfirmComponent;
  @ViewChild('questionsTemplate') questionsModal:  ModalDirective ;
  @ViewChild('servicesTemplate') servicesRef: TemplateRef<any>;

  ignoreHeaderRoutes = ['/signup', '/forgot-password'];
  isPageWithoutHeader = false;
  onBoarded = true;
  guideTourElements: any;
  steps: TourGuideStep[];
  allSteps: TourGuideStep[];
  interval: any;
  intervalChild: any;
  path: string;
  doneRefs: any[] = [];
  introJS = introJs();
  isIframe: Boolean;
  isTourInProgress = false;
  render: () => void;
  tourGuide: TourGuide;
  hasAction: boolean;
  intervalTimeCounter = 0;
  modalRef: BsModalRef;
  modalServiceRef: BsModalRef;
  quizAnswers: any;
  enabledServices: string[] = [];
  allServices: Service[] = [];
  totalServices: Service[] = [];
  inModal = true;
  showQuizModal = false;
  currentOrganization: any;
  services: string[];

  // default to org for now.
  questionTarget: QuestionTarget = QuestionTarget.ORGANIZATION;

  constructor(
    public authService: AuthService,
    private router: Router,
    private tourGuideStepRestService: TourGuideStepRestService,
    private tourGuideRestService: TourGuideRestService,
    private tourGuideService: TourGuideService,
    private renderer: Renderer2,
    public toastr: ToastrService,
    private questionService: QuestionsService,
    private modalService: BsModalService,
    private servicesService: ServicesService,
    private organizationsService: OrganizationsService
  ) {

    if (environment.production && window.console && window.console.log) {
      window.console.log('%cStop! This area is meant for developers!', 'color: red; font-size: xx-large');
      window.console.log('%cIf someone told you to type or paste something into the area it' +
        'could compromise the security of your account.', 'color: red; font-size: large');
    }

    router.events.forEach((event) => {
      if (event instanceof NavigationEnd) {
        clearInterval(this.interval);
        this.path = this.isLocalhost
          ? '/localhost' + event.urlAfterRedirects
          : '/' + location.pathname.split('/')[1] + event.urlAfterRedirects;
        this.getTourGuidesSteps();
      }
    });


  }

  ngOnInit() {
    // temp fix to allow forgot password and signup page
    const resetPasswordPage = location.pathname.split('/');
    resetPasswordPage.pop();
    this.isIframe = this.checkIframe();

    this.getStartTourProcess();

    // logic for checking updated onboarding questions
    // this.checkSetupConfigure();

    this.authService.loggedIn.subscribe((loggedIn: any) => {
      if (loggedIn) {
        this.servicesService.list().subscribe(services => {
          this.allServices = services;
          this.totalServices = [...services];
        });
      }
    });

    this.router.events.subscribe(routeEvent => {
      if (routeEvent instanceof ResolveEnd) {
        this.isPageWithoutHeader = this.ignoreHeaderRoutes.includes(routeEvent.url);
      }
    });
  }

  checkIframe(): boolean {
    try {
      return window.self !== window.top;
    } catch (e) {
      return false;
    }
  }

  checkSetupConfigure() {
    forkJoin([this.authService.activeOrganization.pipe(first()), this.authService.currentUser.pipe(first())])
      .subscribe(result => {
        this.currentOrganization = result[0];
        const currentUser = result[1];

        if (!this.currentOrganization) {
          return;
        }

        const role = currentUser.roles.find(r => r.organization._id === this.currentOrganization._id);

        if (!role || role.role !== 'Owner') {
          return;
        }

        const services = this.currentOrganization.services;
        this.services = services;

        forkJoin([this.questionService.listTreeByServices(this.questionTarget, services),
          this.questionService.listAnswers()])
          .subscribe(result => {

            const questions = result[0];

            if (!questions || !questions.length) {
              return;
            }
            const answers = result[1];

            const configuredAnswers = answers.filter(a => a.configured);
            const unConfiguredAnswers = answers.filter(a => !a.configured);

            if (!answers || !answers.length || (configuredAnswers && !configuredAnswers.length)) {
              return this.router.navigate(['/organizations/setup'], { queryParams: { currentStep: 2 } });
            }

            if (this.isOnboardingSkipped(this.currentOrganization._id)) {
              return;
            }

            const answeredQuestions = answers.map(a => a.question);
            const matches = questions.filter(q => answeredQuestions.includes(q._id));
            const isAllParentsAnswered = matches.length === questions.length;

            const unansweredQuestion = answers.find(a => !a.answered);

            if (!isAllParentsAnswered || unansweredQuestion || unConfiguredAnswers && unConfiguredAnswers.length) {
                  this.modalRef = this.modalService.show(this.questionsModal, { ignoreBackdropClick: true, keyboard: false });
            }
          });
    });



  }

  checkSetupConfigure_old() {
    forkJoin([this.questionService.listByTree(this.questionTarget),
       this.questionService.listAnswers(),
       this.authService.activeOrganization.pipe(first()),
       this.authService.currentUser.pipe(first())])
    .subscribe(result => {
      const questions = result[0];
      const answers = result[1];
      this.currentOrganization = result[2];
      const currentUser = result[3];

      if (!this.currentOrganization) {
        return;
      }

      const role = currentUser.roles.find(r => r.organization._id === this.currentOrganization._id);

      if (!role || role.role !== 'Owner') {
        return;
      }

      const configuredAnswers = answers.filter(a => a.configured);
      const unConfiguredAnswers = answers.filter(a => !a.configured);

      if (!answers || !answers.length || (configuredAnswers && !configuredAnswers.length)) {
        return this.router.navigate(['/organizations/setup'], { queryParams: { currentStep: 2 } });
      }

      if (this.isOnboardingSkipped(this.currentOrganization._id)) {
        return;
      }

      const answeredQuestions = answers.map(a => a.question);
      const matches = questions.filter(q => answeredQuestions.includes(q._id));
      const isAllParentsAnswered = matches.length === questions.length;

      const unansweredQuestion = answers.find(a => !a.answered);

      if (!isAllParentsAnswered || unansweredQuestion || unConfiguredAnswers && unConfiguredAnswers.length) {
            this.modalRef = this.modalService.show(this.questionsModal, { ignoreBackdropClick: true, keyboard: false });
      }
    });
  }

  openServicesModal() {
    this.modalServiceRef = this.modalService.show(this.servicesRef, Object.assign({}, { class: 'modal-xxl'}));
  }

  closeServiceModal() {
    if (this.modalServiceRef) {
      this.modalServiceRef.hide();
    }
  }

  closeModal() {
    this.modalRef.hide();
  }

  private get isLocalhost() {
    return window.location.hostname === 'localhost';
  }



  getStartTourProcess() {
    this.tourGuideService.startTour.subscribe((isStartTour: boolean) => {
      if (isStartTour) {
        this.tourGuideStepRestService.list(this.path).subscribe((steps: TourGuideStep[]) => {
          this.steps = steps.filter((s: any) => !s.parent);

          this.allSteps = steps;
          this.getElements();
          this.steps = this.steps.filter((step: TourGuideStep) => {
            // @ts-ignore
            return this.guideTourElements.includes(step.reference) && step.video;
          });
          if (this.steps.length && !this.isTourInProgress) {
            this.startTour();
          } else {
            this.toastr.show('Sorry, we do not have tour guide for this tab');
          }
        });
      }
    });
  }

  getElements() {
    const elements = document.querySelectorAll('[joyrideStep]');
    this.guideTourElements = Array.from(elements).map((el: any) => {
      return el.attributes.joyridestep.nodeValue;
    });
  }

  getVideoTemplate(video: any) {
    const playButton = '<span class="video-icon"></span>';
    const videoTmp = `<video autoplay class='video' controls='' src='${video.url}'></video>`;
    const result = `<div class="video-container">${videoTmp}</div>`;
    return result;
  }

  startTour() {
    const existSteps = this.steps.sort((a, b) => a.step - b.step);
    const actionSteps = existSteps.filter((step: any) => {
      return step.action && step.action === 'CLICK';
    });
    const actionStepsRefs = actionSteps.map((step: TourGuideStep) => {
      return step.reference;
    });
    const existStepsTourData = existSteps.map(e => {
      return {
        element: document.querySelector(`[joyrideStep=${e.reference}]`),
        // @ts-ignore
        intro: e.video ? this.getVideoTemplate(e.video.video) : e.description,
        position: e.stepPosition.toLowerCase()
      };
    });
    this.introJS.setOptions({
      steps: existStepsTourData,
      'scrollToElement': false,
      'keyboardNavigation': false,
      exitOnOverlayClick: false
    });
    this.introJS.onafterchange(() => {
      const nextButton = document.getElementsByClassName('introjs-nextbutton')[0];
      if (this.hasAction && nextButton) {
        nextButton.setAttribute('style', 'opacity:0;visibility:hidden');
      } else if (nextButton) {
        nextButton.setAttribute('style', 'opacity:1;visibility:visible');
      }

    });
    this.introJS.onchange((targetElement) => {
      this.hasAction = false;
      const nextButton = document.getElementsByClassName('introjs-nextbutton')[0];
      if (nextButton) {
        nextButton.addEventListener('click', (event: Event) => {
          event.preventDefault();
          event.stopPropagation();
        });
      }

      const prevButton = document.getElementsByClassName('introjs-prevbutton')[0];
      if (prevButton) {
        prevButton.addEventListener('click', (event: Event) => {
          event.preventDefault();
          event.stopPropagation();
        });
      }

      const tooltip = document.getElementsByClassName('introjs-tooltip')[0];
      if (tooltip) {
        tooltip.addEventListener('click', (event: Event) => {
          event.preventDefault();
          event.stopPropagation();
        });
      }

      const reference = targetElement.attributes.joyridestep.nodeValue;
      if (actionStepsRefs.includes(reference)) {
        const parent = this.steps.find(s => s.reference === reference) as any;
        const childTourSteps = this.allSteps.filter((s: any) => {
          return s.parent === parent._id;
        });
        if (!childTourSteps.length) {
          return;
        }
        this.hasAction = true;
        this.render = this.renderer.listen(targetElement, 'click', () => {
          if (!this.doneRefs.includes(reference) && this.isTourInProgress) {
            this.doneRefs.push(reference);
            this.intervalChild = setInterval(() => { this.onChildThrottle(childTourSteps, existStepsTourData, reference); }, 1000);
          }
        });
      }
    });

    this.introJS.start();
    this.isTourInProgress = true;
    this.introJS.onexit(() => {
      this.isTourInProgress = false;
      this.doneRefs = [];
    });
    this.introJS.onskip(() => {
      if (this.tourGuide && this.tourGuide.finished && this.tourGuide.finished.includes(this.path)) {
        return;
      }
      this.finishTour();
      // tslint:disable-next-line:max-line-length
      this.genericConfirm.show({ text: `You are closing this tour. Now it will not automatically start on this route. But you can always start it from Help Center.`,
      headlineText: 'Close tour',
      confirmText: 'Ok', cancelText: 'Cancel', callback: () => {} });
    });


  }

  finishTour() {
    this.isTourInProgress = false;
    this.tourGuideRestService.update({ path: this.path }).subscribe((res: any) => {
      this.tourGuide = res;
    });
  }

  onThrottle() {
    this.intervalTimeCounter++;
    this.getElements();
    const exist = this.steps.every((step: TourGuideStep) => {
      return this.guideTourElements.includes(step.reference);
    });
    if (exist) {
      this.intervalTimeCounter = 0;
      clearInterval(this.interval);
      this.startTour();
    }
    if (this.intervalTimeCounter > 3) {
      this.intervalTimeCounter = 0;
      clearInterval(this.interval);
      this.getElements();
      this.steps = this.steps.filter((step: TourGuideStep) => {
        return this.guideTourElements.includes(step.reference);
      });
      this.startTour();
    }
  }

  onChildThrottle(childSteps: TourGuideStep[], existStepsTourData: any[], reference: string) {
    existStepsTourData = [...existStepsTourData];
    const elements = document.querySelectorAll('[joyrideStep]');
    this.guideTourElements = Array.from(elements).map((el: any) => {
      return el.attributes.joyridestep.nodeValue;
    });
    const exist = childSteps.every((step: TourGuideStep) => {
      return this.guideTourElements.includes(step.reference);
    });
    if (exist) {
      clearInterval(this.intervalChild);
      const stepsForAdd = childSteps.map(e => {
        return {
          element: document.querySelector(`[joyrideStep=${e.reference}]`),
          intro: e.description,
          position: e.stepPosition.toLowerCase()
        };
      });
      const position = existStepsTourData.map((e) => e.element.attributes.joyridestep.nodeValue).indexOf(reference);
      existStepsTourData.splice(position + 1, 0, ...stepsForAdd);
      this.introJS.exit();
      this.introJS.setOptions({
        steps: existStepsTourData,
        'scrollToElement': false,
        'keyboardNavigation': false
      });
      this.introJS.refresh();
      this.introJS.start();

      this.introJS.goToStep(position + 2);
      this.isTourInProgress = true;
    }
  }

  async getTourGuidesSteps() {
    const tourGuide = await this.tourGuideRestService.list().pipe(first()).toPromise();
    this.tourGuide = tourGuide;
    if (!tourGuide || !this.tourGuide.finished || !tourGuide.finished.includes(this.path)) {
      this.tourGuideStepRestService.list(this.path).subscribe((steps: TourGuideStep[]) => {
        this.steps = steps.filter((s: any) => !s.parent);
        this.allSteps = steps;
        if (steps && steps.length) {
          this.interval = setInterval(() => { this.onThrottle(); }, 1000);
        }
      });
    }
  }

  onQuestionsSubmit(result: { answers: Answer[], questions: Question[] }) {
    this.closeModal();
    const orgServices = [...this.currentOrganization.services];
    this.enabledServices = [...orgServices];

    return this.processNoEditionalEnabling();

    const enabledServices = servicesToEnableFromAnswers(result.answers, result.questions);
    this.enabledServices = Array.from(new Set([...orgServices as any, ...enabledServices]));

    const isAllEnabled = this.enabledServices ? this.enabledServices.every(e => orgServices.includes(e)) : undefined;

    if (isAllEnabled) {
      return this.processNoEditionalEnabling();
    }

    if (orgServices && orgServices.length) {
      this.allServices = this.allServices.filter(s => !s.core && !orgServices.includes(s._id) && this.enabledServices.includes(s._id));

      if (!this.allServices.length) {
        return this.processNoEditionalEnabling();
      }

    }


    this.openServicesModal();

    this.quizAnswers = result.answers;
  }

  processNoEditionalEnabling() {
    const enabledServices = this.enabledServices.map(s => this.totalServices.find(a => a._id === s));
    const services = enabledServices
    .map(s => {
      return {
        enabled: true,
        service: s
      };
    });
    this.onServicesSaved(services);
  }

  onServicesSaved(services: Array<{ enabled: boolean, service: Service }>) {
    this.closeServiceModal();
    const enabledServices = services.filter(s => s.enabled).map(s => s.service._id);
    this.organizationsService.updateServicesConfig(enabledServices).subscribe((o: Organization) => {
      this.deleteOnBoardingOrg(this.currentOrganization._id);
      window.location.reload(true);
    }, (error) => this.toastr.error(error));
  }

  onSkipSetup() {
    this.closeModal();
    this.setOnBoardingOrg(this.currentOrganization._id);

    setTimeout(() => {
      this.showSkipConfirm();
    }, 300);
  }

  showSkipConfirm() {
    this.genericConfirm.show({ text: `You are closing setup. This window will appear next time you login if setup will not be configured by other organization Owners.`,
    headlineText: 'Close setup',
    confirmText: 'Ok', cancelText: 'Cancel', callback: () => {} });
  }

  deleteOnBoardingOrg(organizationId: string) {
    const storage = (JSON.parse(localStorage.getItem(ONBOARDING_KEY)) || []) as {token: string, organization: string}[];
    const index = storage.findIndex(o => o.organization === organizationId);
    if (index >= 0) {
      localStorage.setItem(ONBOARDING_KEY, JSON.stringify(storage.splice(index, 1)));
    }
  }

  setOnBoardingOrg(organization: string) {
    const token = Cookie.get('fl_token');
    const storage = (JSON.parse(localStorage.getItem(ONBOARDING_KEY)) || []) as {token: string, organization: string}[];
    const index = storage.findIndex(o => o.organization === organization);
    if (index >= 0) {
      storage[index].token = token;
    } else {
      storage.push({organization, token});
    }
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(storage.splice(index, 1)));
  }


  isOnboardingSkipped(organizationId: string) {
    const storage = (JSON.parse(localStorage.getItem(ONBOARDING_KEY)) || []) as {token: string, organization: string}[];
    const token = Cookie.get('fl_token');
    const orgOnboardingStats = storage.find(o => o.organization === organizationId);
    if (!orgOnboardingStats) { return false; }
    return token === orgOnboardingStats.token;
  }

}
