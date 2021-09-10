import { Component, OnInit, TemplateRef, ViewChild, OnDestroy } from '@angular/core';
import { AuthService } from '@aitheon/core-client';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Subscription } from 'rxjs';
import { QuizAnswer, servicesToEnable } from 'app/shared/questions/shared/question';
import { Service, ServicesService, SERVICE_IGNORE_LIST } from '../../services/shared';
import { map } from 'rxjs/operators';
import { UsersService } from '../shared';
import { environment } from '../../../environments/environment';


@Component({
  selector: 'fl-user-onboarding',
  templateUrl: './user-onboarding.component.html',
  styleUrls: ['./user-onboarding.component.scss']
})
export class UserOnboardingComponent implements OnInit, OnDestroy {


  constructor(private authService: AuthService,
              private modalService: BsModalService,
              private serviceService: ServicesService,
              private usersService: UsersService
             ) { }

  onBoarded = true;
  modalRef: BsModalRef;
  authSub: Subscription;
  servicePickMode = false;
  allServices: Service[];
  selectedUserTypes: string[];
  enabledServices: string[];
  questionsMode = false;


  @ViewChild('questionsTemplate') questionsRef: TemplateRef<any>;


  ngOnInit() {

  }


  initQuestions() {
    this.questionsMode = true;
    this.onBoarded = true;
    this.openModal();
    this.loadServices();
  }

  onQuestionsSubmit(answers: QuizAnswer[]) {
    this.enabledServices = servicesToEnable(answers);
    this.servicePickMode = true;
    this.modalRef.hide();
  }

  loadServices() {
    this.serviceService.listPersonal()
      .pipe(
        map(services => services.filter(s => !SERVICE_IGNORE_LIST.includes(s._id)).sort(s => s.core ? 1 : -1))
      )
      .subscribe(services => {
        this.allServices = services;
      });
  }

  openModal() {
    this.modalRef = this.modalService.show(this.questionsRef, { ignoreBackdropClick: true });
  }

  ngOnDestroy() {
    this.authSub.unsubscribe();
  }

  onServicesSaved(services: Array<{ enabled: boolean, service: Service }>) {
    const serviceList = services.filter(s => s.enabled).map(s => s.service._id);

    this.usersService.processOnBoarding(serviceList, this.selectedUserTypes)
      .subscribe(() => {
        this.saveInfoAboutFirstLogin();

        const relocateUrl = environment.production ? '/users/dashboard' : '/dashboard';
        location.href = relocateUrl;
      });

  }

  selectUserTypes(userTypes: string[]) {
    this.selectedUserTypes = userTypes;

    if (this.selectedUserTypes.length === 0) {
      this.enabledServices = [];
      this.loadServices();
      return this.servicePickMode = true;
    }
    // Quiz should not be shown since it's not implemented yet
    // this.initQuestions();

    this.enabledServices = [];
    this.loadServices();
    this.servicePickMode = true;
  }

  private saveInfoAboutFirstLogin(): void {
    const firstLogin = {
      isFirstLogin: true
    };

    localStorage.setItem('firstLogin', JSON.stringify(firstLogin));
  }
}
