import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RestService } from '@aitheon/core-client';
import { Question, QuestionTarget } from './question';
import { Answer } from './answer';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root'
})
export class QuestionsService {

  constructor(private restService: RestService) { }

  create(question: Question) {
   return this.restService.post('/api/admin/questions', question);
  }

  listByTarget(target: QuestionTarget, optionId?: string, service?: string): Observable<Question[]> {
    return this.restService.fetch( `/api/admin/questions/${target.toString()}/${optionId ? optionId : ''}?service=${service}`)
      .pipe(map((q: Question[]) => q.sort((q1, q2) => q1.number - q1.number )));
  }

  listByTree(target: QuestionTarget, questionId?: string) {
    return this.restService.fetch(`/api/admin/questions/${target.toString()}/tree/${questionId ? `?questionId?=${questionId}` : '' }`);
  }

  listTreeByServices(target: QuestionTarget, services: string[]) {
    return this.restService.post(`/api/admin/questions/${target.toString()}/service-tree`, services);
  }

  listTreeByService(target: QuestionTarget, service: string) {
    return this.restService.fetch(`/api/admin/questions/${target.toString()}/service-tree/${service}`);
  }

  listByUserTypes(userType: string): Observable<Question[]> {
    return this.restService.fetch( `/api/admin/questions/${QuestionTarget.USER.toString()}/${userType}`);
  }

  getById(questionId: string): Observable<Question> {
    return this.restService.fetch(`/api/admin/question/${ questionId }`);
  }

  update(questionId: string, question: Question): Observable<Question> {
    return this.restService.put(`/api/admin/questions/${ questionId }`, question);
  }

  remove(questionId: string): Observable<Question> {
    return this.restService.delete(`/api/admin/questions/${ questionId }`);
  }

  saveAnswer(answer: Answer): Observable<Answer> {
    return this.restService.post(`/api/admin/answers`, answer);
  }

  deleteAnswerByQuestion(questionId: string): Observable<Answer> {
    return this.restService.delete(`/api/admin/answers/questions/${ questionId }`);
  }

  listAnswers(): Observable<Answer[]> {
    return this.restService.fetch(`/api/admin/answers`);
  }

  removePreviousAnswers(answers: Answer[]): Observable<any> {
    return this.restService.post(`/api/admin/answers/remove`, answers);
  }

}
