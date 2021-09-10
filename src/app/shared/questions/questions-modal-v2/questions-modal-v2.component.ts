import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { Question, QuestionType, QuizAnswer, convertQuestionModel, QuestionTarget } from '../shared/question';
import { FormGroup, FormBuilder, FormArray, Validators } from '@angular/forms';
import { QuestionsService } from '../shared/questions.service';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { Answer, convertAnswerModel } from '../shared/answer';
import { Router } from '@angular/router';

// This component will handle onborading of organization for now.

@Component({
  selector: 'fl-questions-modal-v2',
  templateUrl: './questions-modal-v2.component.html',
  styleUrls: ['./questions-modal-v2.component.scss']
})
export class QuestionsModalV2Component implements OnInit {

  questions: Question[] = [];
  topLevelquestions: Question[] = [];
  currentQuestionIndex = 0;
  currentTopLevelQuestionIndex = 0;
  questionType = QuestionType;
  loading = true;
  questionsForm: FormGroup;
  questionLevels: any[] = [];
  answers: Answer[];
  configuredAnswers: Answer[];
  unConfiguredAnswers: Answer[];
  answersToRemove: Answer[] = [];

  @Input() target: QuestionTarget;
  @Input() isSetup: boolean;
  @Input() services: string[];
  @Input() service: string;
  @Output() questionsSubmit = new EventEmitter<any>();
  @Output() skipSetup = new EventEmitter<any>();

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private questionService: QuestionsService,
    private toastr: ToastrService
    ) {
    this.questions = [];
  }

  ngOnInit() {
    forkJoin([this.questionService.listTreeByService(this.target, this.service), this.questionService.listAnswers()]).subscribe(result => {
      this.questions = result[0];
      this.answers = result[1];

      this.topLevelquestions = [...this.questions];

      if (!this.questions.length) {
        return this.noQuestions();
      }

      this.processQuestions();

      if (this.isSetup) {
        this.configureAnswers();
        this.buildForm();
      } else {
        this.questions = this.questions.map(q => {
          const answer = this.answers.find(a => a.question === q._id);
          return {...q, selectedOption: answer ? answer.option : ''};
        });
        this.buildForm();
        this.processUpdate();
      }

      this.loading = false;
    }, err => this.handleError(err));

  }

  processQuestions() {

      this.configuredAnswers = this.answers.filter(a => a.configured);
      this.unConfiguredAnswers = this.answers.filter(a => !a.configured);

  }

  handleError(error: any) {
    this.toastr.error(error.message ? error.message : error);
  }


  noQuestions() {
    // adding timeout to wait for bootstrap modal to load or else it's not hidden
    setTimeout(() => {
      return this.questionsSubmit.emit({});
    }, 400);
  }

  get currentQuestion(): Question {
    return this.questions[this.currentQuestionIndex];
  }

  selectOption(optionId: string) {
    this.questionsFormArray.controls[this.currentQuestionIndex].get('selectedOption').setValue(optionId);
  }

  get questionProgress() {
   return  ((this.currentTopLevelQuestionIndex + 1) / this.topLevelquestions.length   * 100);
  }

  get questionsFormArray() {
    return this.questionsForm.get('questions') as FormArray;
  }

  prevQuestion() {
    const answerValue = this.questionsFormArray.value[this.currentQuestionIndex];
    const question = this.questions[this.currentQuestionIndex];
    const previousQuestion = this.questions[this.currentQuestionIndex - 1];
    const option = question.parentOption ? previousQuestion.options.find(o => o._id === question.parentOption) : undefined;

    this.questionService.deleteAnswerByQuestion(answerValue.questionId).subscribe(() => {
      if (option) {
        const questionsToRemove = option.childQuestions;
        this.questions.splice(this.currentQuestionIndex, questionsToRemove.length);
        questionsToRemove.forEach((q: any) => {
          this.questionsFormArray.removeAt(this.currentQuestionIndex);
        });

      }

      if (!question.parentOption) {
        this.currentTopLevelQuestionIndex = this.currentTopLevelQuestionIndex - 1;
      }

      this.currentQuestionIndex = this.currentQuestionIndex - 1;
    });

  }

  nextQuestion() {

    if (!this.isCurrentGroupValid) {
      return this.questionsFormArray.controls[this.currentQuestionIndex].markAsTouched();
    } else {

      const answerValue = this.questionsFormArray.value[this.currentQuestionIndex];
      const question = this.questions[this.currentQuestionIndex];

      if (!this.isSetup) {
        const existAnswer = this.answers.find(a => a.question === answerValue.questionId);
        const isSameOption = existAnswer ? existAnswer.option === answerValue.selectedOption : false;

        if (existAnswer && !isSameOption) {
          this.removeChildsAnswers(existAnswer);
        }

        this.questionService.saveAnswer(convertAnswerModel(answerValue)).subscribe((answer: Answer) => {
          if (!existAnswer) {
            this.answers.push(answer);
          } else {
            this.answers = this.answers.map(a => {
              return a.question === answer.question ? answer : a;
            });
          }
          this.nextTick();
        });
        return;
      }

      const selectedOption = question.options.find((option: any) => answerValue.selectedOption === option._id);
      if (selectedOption.childQuestions && selectedOption.childQuestions.length) {
        this.questions.splice(this.currentQuestionIndex + 1, 0, ...selectedOption.childQuestions);
        const groups = selectedOption.childQuestions.map(q => {
          return this.fb.group({
            questionId: q._id,
            selectedOption: this.fb.control('', [Validators.required]),
            number: q.number
          });
        });
        for (let i = 0; i < groups.length; i++) {
          this.questionsFormArray.insert(this.currentQuestionIndex + i + 1, groups[i]);
        }
      }

      this.questionService.saveAnswer(convertAnswerModel(answerValue)).subscribe((answer: Answer) => {
        this.answers = this.answers.filter(a => a.question !== answerValue.questionId);
        this.answers.push(answer);
        if (this.currentQuestionIndex === this.questions.length - 1) {
          return this.questionsSubmit.emit({questions: this.questions, answers: this.answers});
        } else {
          if (!this.questions[this.currentQuestionIndex + 1].parentOption) {
            this.currentTopLevelQuestionIndex = this.currentTopLevelQuestionIndex + 1;
          }
          this.currentQuestionIndex = this.currentQuestionIndex + 1;
        }
      });
    }

  }

  configureAnswers() {
    const parentsQuestions = [];
    for (let i = 0; i < this.unConfiguredAnswers.length; i++) {
      const answer = this.unConfiguredAnswers[i];
      const selectedOption = this.questions[i].options.find(o => answer.option === o._id);
      const question = this.questions.find(q => q._id === answer.question);

      if (!question || !selectedOption) return;

      if (!question.parentOption) {
        parentsQuestions.push(question);
        this.currentTopLevelQuestionIndex = parentsQuestions.length - 1;
      }

      this.questions.splice(i, 1, {...this.questions[i], selectedOption: answer.option});
      if (selectedOption.childQuestions && selectedOption.childQuestions.length) {
        this.questions.splice(i + 1, 0, ...selectedOption.childQuestions);
      }

    }

    if (this.questions.length === this.unConfiguredAnswers.length) {
      return this.questionsSubmit.emit({questions: this.questions, answers: this.answers});
    }

    this.currentQuestionIndex += this.unConfiguredAnswers.length;

    const currentQuestion = this.questions[this.currentQuestionIndex];
    if (currentQuestion && !currentQuestion.parentOption && this.unConfiguredAnswers.length) {
      this.currentTopLevelQuestionIndex++;
    }
  }

  processUpdate() {
    this.nextTick();
  }

  nextTick() {
    const currentQuestion = this.questions[this.currentQuestionIndex];
    const currentAnswer = this.answers.find(a => a.question === currentQuestion._id);

    if (currentAnswer && currentAnswer.answered) {
      const selectedOption = currentQuestion.options.find(o => o._id === currentAnswer.option);
      if (selectedOption.childQuestions && selectedOption.childQuestions.length) {
        this.questions.splice(this.currentQuestionIndex + 1, 0, ...selectedOption.childQuestions);
        const groups = selectedOption.childQuestions.map(q => {
          const currentSelectedAnswer = this.answers.find(a => a.question === q._id);
          return this.fb.group({
            questionId: q._id,
            selectedOption: this.fb.control(currentSelectedAnswer ? currentSelectedAnswer.option : '', [Validators.required]),
            number: q.number
          });
        });
        for (let i = 0; i < groups.length; i++) {
          this.questionsFormArray.insert(this.currentQuestionIndex + i + 1, groups[i]);
        }
      }

      if (this.currentQuestionIndex === this.questions.length - 1) {
        return this.questionsSubmit.emit({ questions: this.questions, answers: this.answers });
      } else {
        if (!this.questions[this.currentQuestionIndex + 1].parentOption) {
          this.currentTopLevelQuestionIndex = this.currentTopLevelQuestionIndex + 1;
        }
        this.currentQuestionIndex = this.currentQuestionIndex + 1;
      }
      this.nextTick();
    }

  }

  private buildForm() {

    const groups = this.questions.map(q => {
      return this.fb.group({
        questionId: q._id,
        selectedOption: this.fb.control(q.selectedOption || '', [Validators.required]),
        number: q.number
      });
    });

    this.questionsForm = this.fb.group({
      questions: this.fb.array(groups)
    });

  }

  removeChildsAnswers(answer: Answer) {
    const question = this.questions[this.currentQuestionIndex];
    this.answersToRemove.push(answer);

    this.getAnswersFromQuestions(question, answer);

    this.questionService.removePreviousAnswers(this.answersToRemove).subscribe(() => {
      this.answersToRemove = [];
    });
  }

  getAnswersFromQuestions(question: Question, answer: Answer) {
    const option = question.options.find(o => o._id === answer.option);
    const childQuestions = option.childQuestions;
    if (childQuestions && childQuestions.length) {
      for (const childQuestion of childQuestions) {
        const childAnswer = this.answers.find(a => a.question === childQuestion._id);
        if (!childAnswer) return;
        this.answersToRemove.push(childAnswer);
        this.getAnswersFromQuestions(childQuestion, childAnswer);
      }
    }
  }

  isChecked(optionId: string) {
    return this.questionsFormArray.controls[this.currentQuestionIndex].value.selectedOption === optionId;
  }

  get isCurrentGroupValid() {
    return this.questionsFormArray.controls[this.currentQuestionIndex].valid;
  }

  skip() {
    this.skipSetup.emit();
  }

}
