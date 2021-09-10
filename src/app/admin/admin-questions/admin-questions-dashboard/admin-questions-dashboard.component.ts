import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Question, QuestionTarget } from '../../../shared/questions/shared/question';

import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { AdminQuestionsListComponent } from '../admin-questions-list/admin-questions-list.component';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserType } from '../../admin-user-types/shared/user-type';
import { Service } from '../../../services/shared';

@Component({
  selector: 'ai-admin-questions-dashboard',
  templateUrl: './admin-questions-dashboard.component.html',
  styleUrls: ['./admin-questions-dashboard.component.scss']
})
export class AdminQuestionsDashboardComponent implements OnInit {

  @ViewChild('adminQuestionsListComponent') adminQuestionsListComponent: AdminQuestionsListComponent;

  modalRef: BsModalRef;
  activeTab: string = QuestionTarget.ORGANIZATION;
  questionTarget = QuestionTarget;
  editQuestionId: string;
  querySubscription: Subscription;
  selectedUserType: UserType;
  bigModal = false;
  selectedService: Service;

  constructor(
    private modalService: BsModalService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.querySubscription = this.route.queryParams.subscribe(
      (queryParam: any) => {
        this.activeTab = queryParam['activeTab'];
        this.selectedUserType = null;
        this.selectedService = null;
        this.changeTab(this.activeTab);
      }
    );
  }

  openModal(template: TemplateRef<any>, editQuestionId: string = null) {
    this.editQuestionId = editQuestionId;
    this.modalRef = this.modalService.show(
      template,
      Object.assign({}, { class: 'modal-responsive'})
      );
  }

  changeTab(type: any) {
    this.activeTab = type;
    if (this.adminQuestionsListComponent) {
      this.adminQuestionsListComponent.changeType(type);
    }
  }

  closeModal() {
    this.editQuestionId = null;
    this.modalRef.hide();
  }

  modalSaved(question: Question) {
    this.adminQuestionsListComponent.onSaveQuestion(question);
    this.closeModal();
  }

  onSelectType(userType: UserType) {
    this.selectedUserType = userType;
  }

  makeModalBigger() {
    this.bigModal = true;
  }

  onSelectService(service: Service) {
    this.selectedService = service;
  }
}
