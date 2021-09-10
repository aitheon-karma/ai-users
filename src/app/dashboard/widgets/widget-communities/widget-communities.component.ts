import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'fl-widget-communities',
  templateUrl: './widget-communities.component.html',
  styleUrls: ['./widget-communities.component.scss']
})
export class WidgetCommunitiesComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

  click(){
    window.location.href = '/community';
  }
}
