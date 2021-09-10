import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'ai-widget-market',
  templateUrl: './widget-market.component.html',
  styleUrls: ['./widget-market.component.scss']
})
export class WidgetMarketComponent implements OnInit {
  view: any[] = [530, 170];
  showXAxis = true;
  showYAxis = false;
  gradient = false;
  showLegend = false;
  showXAxisLabel = false;
  showYAxisLabel = false;
  timeline = true;

  single: any[] = [
    {
      "name": "03/15",
      "value": 64
    },
    {
      "name": "03/16",
      "value": 90
    },
    {
      "name": "03/17",
      "value": 80
    },
    {
      "name": "03/18",
      "value": 20
    },
    {
      "name": "03/19",
      "value": 40
    },
    {
      "name": "03/20",
      "value": 10
    },
    {
      "name": "03/21",
      "value": 15
    },
    {
      "name": "03/22",
      "value": 47
    },
    {
      "name": "03/23",
      "value": 35
    }
    
  ];

  colorScheme = {
    domain: ['#363636']
  };

  constructor() { }

  ngOnInit() {
  }

}
