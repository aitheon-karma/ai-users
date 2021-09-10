import { Component, OnInit } from '@angular/core';
import { QuestionTarget } from '../shared/questions/shared/question';

@Component({
  selector: 'ai-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  questionTarget = QuestionTarget;
  isActiveQuestions = false;
  isActiveTypes = false;
  isActiveTutorials = false;

  constructor() { }

  ngOnInit() {
  }

}
