import { Component, OnInit, Input, EventEmitter, Output, ViewChild } from '@angular/core';
import { Service, ServicesService, SERVICE_IGNORE_LIST } from '../../../services/shared';
import { map, first } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators, FormControl, FormArray } from '@angular/forms';
import { Question, QuestionTarget, QuestionType, QuestionOption } from '../../../shared/questions/shared/question';
import { UserTypeService } from '../../admin-user-types/shared/user-types.service';
import { UserType } from '../../admin-user-types/shared/user-type';
import { ToastrService } from 'ngx-toastr';
import { QuestionsService } from '../../../shared/questions/shared/questions.service';
import { ActivatedRoute } from '@angular/router';


@Component({
  selector: 'ai-admin-question-form',
  templateUrl: './admin-question-form.component.html',
  styleUrls: ['./admin-question-form.component.scss']
})
export class AdminQuestionFormComponent implements OnInit {

  @Input() editQuestionId: string;
  @Input() activeTab: any;
  @Input() questionNumber: number;
  @Input() selectedUserType: UserType;
  @Input() selectedService: Service;
  @Output() closeModal: EventEmitter<any> = new EventEmitter<any>();
  @Output() modalSaved: EventEmitter<Question> = new EventEmitter<Question>();
  @Output() bigModal: EventEmitter<boolean>;

  questionTarget = QuestionTarget;
  questionType = QuestionType;
  questionTypeArray: any = [];
  selectedType: any;
  userTypes: UserType[];
  selectedServiceGroup: FormGroup;

  events: Event[] = [];

  services: Service[];
  questionsForm: FormGroup;
  question: Question;
  questions: Question[];
  loading = false;
  submitted = false;
  isConfigOpen = false;

  constructor(
    private servicesService: ServicesService,
    private fb: FormBuilder,
    private userTypeService: UserTypeService,
    private questionService: QuestionsService,
    private toastr: ToastrService,
    private route: ActivatedRoute
  ) { }

  private getOptions(): FormArray {
    return <FormArray>this.questionsForm.get('options');
  }

  async ngOnInit() {
    if (this.editQuestionId) {
      try {
        this.question = await this.questionService.getById(this.editQuestionId).toPromise();
      } catch (err) {
        this.handleError(err);
      }
    } else {
      this.question = new Question();
    }
    for (const qType of Object.keys(this.questionType)) {
      const lowercase = this.questionType[qType].replace(/_/g, ' ').toLowerCase();
      this.questionTypeArray.push({
        value: qType,
        name: lowercase.charAt(0).toUpperCase() + lowercase.slice(1)
      });
    }
    this.selectedType = this.question.questionType || QuestionType.SINGLE_IMAGE;
    this.questionsForm = this.fb.group({
      questionText: [this.question.questionText, Validators.required],
      number: [this.question.number || this.questionNumber],
      imageUrl: [this.question.imageUrl],
      questionType: [this.selectedType, Validators.required],
      askAgain: [this.question.askAgain],
      options: this.fb.array(this.initOptions(this.question.options))
    });

    this.servicesService.list()
    .subscribe((services) => {
      this.services = services;
      if (this.activeTab === this.questionTarget.USER) {
        this.services = this.services.filter((service: Service) => {
          return (service.serviceType === 'any') && !service.core;
        });
      }
    }, err => this.handleError(err));

    try {
      this.userTypes = await this.userTypeService.list().pipe(first()).toPromise();
      this.questions = await this.questionService.listByTarget(this.activeTab).pipe(first()).toPromise();
    } catch (err) {
      this.handleError(err);
    }
  }

  ngOnChanges() {
  }

  initOptions(options: any[]): FormGroup[] {
    if (options.length) {
      return options.map(option => this.initOption(option));
    } else {
      return [this.initOption(), this.initOption()];
    }
  }

  initOption(option = {optionText: '', imageUrl: '', enabledServices: [], tooltip: '', _id: ''}): FormGroup {

    const enabledServiceGroup = option.enabledServices
      .map(es => this.fb.group({service: [es.service], config: [es.config]}));

    const group = this.fb.group({
      optionText: [option.optionText, [Validators.required]],
      imageUrl: option.imageUrl,
      enabledServices: this.fb.array(enabledServiceGroup),
      tooltip: [option.tooltip],
    });

    if (option._id) {
      group.addControl('_id', this.fb.control(option._id));
    }

    return group;
  }

  removeOption(i: number) {
    const items = this.getOptions();
    if (items.length <= 2) {
      return this.toastr.error('Minimum 2 options allowed');
    }
    items.removeAt(i);
  }

  addOption() {
    const items = this.getOptions();
    items.push(this.initOption());
  }

  async saveChanges() {
    this.submitted = true;
    this.loading = true;
    if (!this.questionsForm.valid) {
      this.loading = false;
      return;
    }

    this.question.target = this.question.target || this.activeTab;
    const question = Object.assign({} as Question, this.question, this.questionsForm.value);
    question.parentOption = this.route.snapshot.queryParams.parentOption;
    if (this.selectedUserType) {
      question.userType = this.selectedUserType._id;
    }
    if (this.selectedService) {
      question.service = this.selectedService._id;
    }
    let result;
    try {
      if (this.editQuestionId) {
        result = await this.questionService.update(this.editQuestionId, question).toPromise();
        this.toastr.success('Question updated');
      } else {
        result = await this.questionService.create(question).toPromise();
        this.toastr.success('Question created');
      }
      this.modalSaved.emit(result);
      this.questionsForm.reset();
    } catch (err) {
      this.handleError(err);
    }
    this.submitted = false;
    this.loading = false;
  }

  onCloseEditModal() {
    this.questionsForm.reset();
    this.closeModal.emit();
  }

  changedType(type: any) {
    this.selectedType = type;
  }

  getValidity(i: number) {
    return this.getOptions().controls[i];
  }

  handleError(error: any) {
    this.toastr.error( error.message || error);
  }

  onRemove(enabledServices: FormArray, index: number) {
    enabledServices.removeAt(index);

    this.isConfigOpen = false;
  }

  openConfigs(selectedService: FormGroup) {
    this.selectedServiceGroup = selectedService;
    this.isConfigOpen = true;
  }

  closeConfigs() {
    this.isConfigOpen = false;
  }

  saveConfigs(textArea: HTMLTextAreaElement) {
   const json = textArea.value;
   try {
     JSON.parse(json);
     this.selectedServiceGroup.get('config').setValue(json);
     this.isConfigOpen = false;
     this.toastr.success('Valid Json, saved');
   } catch (err) {
    this.toastr.error('Invalid Json');
   }
  }

  serviceSelectControl(options: FormGroup) {
    const enabledServicesArray = options.get('enabledServices') as FormArray;
    return this.fb.control(enabledServicesArray.value.map((s: any) => s.service));
  }

  enabledServiceChanged(options: FormGroup, services: Service[]) {
    const enabledServicesArray = options.get('enabledServices') as FormArray;
    const enabledServices = services.map(s => s._id);
    for (const service of enabledServices) {
      const index = enabledServicesArray.controls.findIndex(g => g.value.service === service);
      if (index === -1 ) {
        const group = this.fb.group({service: [service], config: ''});
        enabledServicesArray.push(group);
      }
    }
      const formServices = (enabledServicesArray.value as any[]).map(es => es.service);
      const toRemoveServices = formServices.filter(s => !enabledServices.includes(s));

      toRemoveServices.forEach(s => {
        const i = enabledServicesArray.controls.findIndex(g => g.value.service === s);
        enabledServicesArray.removeAt(i);
        enabledServicesArray.updateValueAndValidity();
      });
  }
}
