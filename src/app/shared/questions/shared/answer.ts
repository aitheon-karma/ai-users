

export class Answer {
  _id?: string;
  user?: any;
  organization?: any;
  question: any;
  option: any;
  configured: boolean;
  answered: boolean;
  answeredBy: any;
}

export function convertAnswerModel(answer: { questionId: string, selectedOption: string, number: Number }): Answer {

  const result = new Answer();
  result.question = answer.questionId;
  result.option = answer.selectedOption;
  result.answered = true;

  return result;
}
