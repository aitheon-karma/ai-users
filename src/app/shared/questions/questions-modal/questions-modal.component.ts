import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { Question, QuestionType, QuizAnswer, convertQuestionModel, QuestionTarget } from '../shared/question';
import { FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { QuestionsService } from '../shared/questions.service';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'fl-questions-modal',
  templateUrl: './questions-modal.component.html',
  styleUrls: ['./questions-modal.component.scss']
})
export class QuestionsModalComponent implements OnInit {

  questions: Question[] = [];
  currentQuestionIndex = 0;
  questionType = QuestionType;
  loading = true;
  questionsForm: FormGroup;

  @Input() target: QuestionTarget;
  @Input() userTypes: string[];
  @Output() questionsSubmit = new EventEmitter<Array<QuizAnswer>>();

  constructor(private fb: FormBuilder, private questionService: QuestionsService, private toastr: ToastrService) {
    this.questions = [];
    // Adding dummy data
  }

  ngOnInit() {
    if (this.userTypes) {

      const question$ = [];
      this.userTypes.forEach(ut => {
         question$.push(this.questionService.listByUserTypes(ut));
      });
      forkJoin(question$).subscribe((questions: any) => {
        questions.forEach(q =>  this.questions = [...this.questions, ...q]);
        if (!this.questions.length) {
          return this.noQuestions();
        }
        this.buildForm();
        this.loading = false;
      }, err => this.handleError(err));
    } else {
      this.questionService.listByTarget(this.target).subscribe(questions => {
        this.questions = questions;
        if (!this.questions.length) {
          return this.noQuestions();
        }
        this.buildForm();
        this.loading = false;
      }, err => this.handleError(err));
    }
  }

  handleError(error: any) {
    this.toastr.error(error.message ? error.message : error);
  }


  noQuestions() {
    // adding timeout to wait for boostrap modal to load or else it's not hidden
    setTimeout(() => {
      this.questionsSubmit.emit([]);
    }, 400);
  }

  get currentQuestion(): Question {
    return this.questions[this.currentQuestionIndex];
  }

  selectOption(optionId: string) {
    this.questionsFormArray.controls[this.currentQuestionIndex].get('selectedOption').setValue(optionId);
  }

  get questionProgress() {
   return  ((this.currentQuestionIndex + 1) / this.questions.length   * 100);
  }

  get questionsFormArray() {
    return this.questionsForm.get('questions') as FormArray;
  }

  prevQuestion() {
    this.currentQuestionIndex = this.currentQuestionIndex - 1;
  }

  nextQuestion() {

    if (!this.isCurrentGroupValid) {
      this.questionsFormArray.controls[this.currentQuestionIndex].markAsTouched();
    } else if (this.currentQuestionIndex === this.questions.length - 1) {
        // building data for emiting.
      const value = this.questionsFormArray.value as [{ questionId: string, selectedOption: string }];

      this.questions.forEach((q, i) => {
        this.questions[i].answeredOption = this.questions[i].options.find(o => o._id === value[i].selectedOption);
      });
      this.questionsSubmit.emit(convertQuestionModel(this.questions));

    } else {
      this.currentQuestionIndex = this.currentQuestionIndex + 1;
    }
  }

  private buildForm() {
    const groups = this.questions.map(q => {
      return this.fb.group({
        questionId: q._id,
        selectedOption: this.fb.control('', [Validators.required]),
        number: q.number
      });
    });

    this.questionsForm = this.fb.group({
      questions: this.fb.array(groups)
    });
  }

  isChecked(optionId: string) {
    return this.questionsFormArray.controls[this.currentQuestionIndex].value.selectedOption === optionId;
  }

  get isCurrentGroupValid() {
    return this.questionsFormArray.controls[this.currentQuestionIndex].valid;
  }
}
