import { Configuration } from '@aitheon/treasury';
import { Answer } from './answer';

export class Question {
  constructor() {
    this.options = [];
    this.askAgain = false;
  }
  questionText: string;
  _id: string;
  questionType: QuestionType;
  answeredOption: QuestionOption;
  options: QuestionOption[];
  imageUrl: string;
  number: number;
  target: QuestionTarget;
  userType?: string;
  parentOption: string;

  // client
  showOptions: boolean;
  selectedOption?: string;
  askAgain: boolean;

}

export enum QuestionType {
  SINGLE_IMAGE = 'SINGLE_IMAGE',
  MULTIPLE_IMAGE = 'MULTIPLE_IMAGE'
}

export enum QuestionTarget {
  ORGANIZATION = 'ORGANIZATION',
  USER = 'USER',
  SERVICES = 'SERVICES'
}

export class QuestionOption {

  constructor() {
  }
  _id?: string;
  imageUrl: string;
  optionText: string;
  enabledServices: string[];

  // client
  childQuestions: Question[];
}


export class QuizAnswer {

  questionText: string;
  imageUrl: string;
  options: Array<QuestionOption>;
  answeredOption: QuestionOption;

  constructor() {
    this.options = [];
  }
}

export function convertQuestionModel(questions: Question[]): QuizAnswer[] {

  const quizAnswers = questions.map(q => {

    const quizAnswer = new QuizAnswer();
    quizAnswer.answeredOption = {
      imageUrl: q.answeredOption.imageUrl,
      optionText: q.answeredOption.optionText,
      enabledServices: q.answeredOption.enabledServices,
      childQuestions: []
    };
    quizAnswer.questionText = q.questionText;
    quizAnswer.imageUrl = q.imageUrl;
    q.options.forEach(o => {
      const option = {
        imageUrl: o.imageUrl,
        optionText: o.optionText,
        enabledServices: o.enabledServices
      };
      quizAnswer.options.push(option as any);
    });
    return quizAnswer;
  });
  return quizAnswers;
}

export function servicesToEnable(quizAnswers: QuizAnswer[]): string[] {
  const services: string[] = [];
  const answeredOptions = quizAnswers.map(q => q.answeredOption);

  answeredOptions.forEach(ans => {
    if (Array.isArray(ans.enabledServices)) {
      ans.enabledServices.forEach((s: any) => {
        services.push(s.service || s);
      });
    }
  });

  return Array.from(new Set(services));
}

export function servicesToEnableFromAnswers(answers: Answer[], questions: Question[]): string[] {
  const services: string[] = [];
  const options = [];
  const answeredOptions = answers.map(a => a.option);
  questions.forEach((q: Question) => {
    options.push(...q.options);
  });

  const selectedOptions = options.filter(o => answeredOptions.includes(o._id));

  selectedOptions.forEach((option: any) => {
    if (option.enabledServices) {
      option.enabledServices.forEach(s => {
        services.push(s.service || s);
      });
    }
  });

  return Array.from(new Set(services));
}
