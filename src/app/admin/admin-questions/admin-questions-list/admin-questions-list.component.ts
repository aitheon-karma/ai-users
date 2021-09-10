import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Question, QuestionTarget, QuestionType } from '../../../shared/questions/shared/question';
import { first } from 'rxjs/operators';
import { UserType } from '../../admin-user-types/shared/user-type';
import { UserTypeService } from '../../admin-user-types/shared/user-types.service';
import { ToastrService } from 'ngx-toastr';
import { QuestionsService } from '../../../shared/questions/shared/questions.service';
import { ActivatedRoute } from '@angular/router';
import { map, switchMap } from 'rxjs/operators';
import { forkJoin , Observable } from 'rxjs';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Service } from '../../../services/shared';

@Component({
  selector: 'fl-admin-questions-list',
  templateUrl: './admin-questions-list.component.html',
  styleUrls: ['./admin-questions-list.component.scss']
})
export class AdminQuestionsListComponent implements OnInit {

  @Input() activeTab: any;
  @Input() selectedService: Service;
  // tslint:disable-next-line: no-output-on-prefix
  @Output() onSelectQuestion: EventEmitter<string> = new EventEmitter<string>();
  // tslint:disable-next-line: no-output-on-prefix
  @Output() onSelectType: EventEmitter<UserType> = new EventEmitter<UserType>();

  questionTarget = QuestionTarget;
  questionType = QuestionType;
  public questions: Question[];
  public allQuestions: Question[];
  userTypes: UserType[];
  currentRole: UserType;
  loading = false;
  optionsShown = false;

  constructor(
    private questionService: QuestionsService,
    private userTypeService: UserTypeService,
    private toastr: ToastrService,
    private route: ActivatedRoute,

) { }

  async ngOnInit() {
   this.userTypes = await this.userTypeService.list().pipe(first()).toPromise();

  }

  ngOnChanges() {
    this.changeType(this.activeTab);
  }

  changeType(type: any) {
    this.route.queryParams
      .pipe(map(queries => { this.loading = true; return { parentOption:  queries.parentOption, activeTab: queries.activeTab}; } ),
        switchMap(params => this.questionService.listByTarget(params.activeTab, params.parentOption, this.selectedService ? this.selectedService._id : '')))
      .subscribe(this.loadQuestions.bind(this));
  }

  drop(event: CdkDragDrop<string[]>) {

    if (event.currentIndex === event.previousIndex) {
      return;
    }

    const requests$: Observable<Question>[] = [];
    moveItemInArray(this.allQuestions, event.previousIndex, event.currentIndex);
    const start = event.currentIndex < event.previousIndex ?  event.currentIndex : event.previousIndex;
    const end = event.previousIndex > event.currentIndex ? event.previousIndex : event.currentIndex;
    for (let i = start; i <= end; i++) {
      const question = this.allQuestions[i];
      question.number = i + 1;
      requests$.push(this.questionService.update(question._id, question));
    }
    forkJoin(requests$).subscribe();
  }

  loadQuestions(questions: Question[]) {
    this.allQuestions = questions;
    this.questions = this.activeTab === QuestionTarget.ORGANIZATION ?
      questions : this.currentRole ? this.allQuestions.filter(q => q.userType === this.currentRole._id) : this.allQuestions;
    this.loading = false;
  }

  selectRole(role: UserType) {
    this.currentRole = role;
    this.questions = this.allQuestions.filter(question => question.userType === role._id);
    this.onSelectType.emit(role);
  }

  goToEdit(question: Question, event: Event) {
    event.stopPropagation();
    this.onSelectQuestion.emit(question._id);
  }

  async onSaveQuestion(question: Question) {
    if (!this.allQuestions.find(q => q._id === question._id)) {
       this.allQuestions.push(question);
    }
    this.loadQuestions(this.allQuestions);
  }

  goToDelete(question: Question) {
    this.questionService.remove(question._id).subscribe((res: any) => {
      this.questions = this.questions.filter(q => question._id !== q._id);
      this.allQuestions = this.allQuestions.filter(q => question._id !== q._id);
      this.toastr.success('Question deleted');
    },
      err => {
        this.toastr.error(err.message || err);
      });
  }

  toggleShown(question: Question) {
    return question.showOptions = question.showOptions === undefined ? true : !question.showOptions;
  }
}

