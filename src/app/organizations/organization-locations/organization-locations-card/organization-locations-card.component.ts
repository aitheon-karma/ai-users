import { Component, OnInit, Input } from '@angular/core';
import {Organization} from "../../shared";

@Component({
  selector: 'ai-organization-locations-card',
  templateUrl: './organization-locations-card.component.html',
  styleUrls: ['./organization-locations-card.component.scss']
})
export class OrganizationLocationsCardComponent implements OnInit {
  @Input() location: any;
  @Input() dashboardView: boolean;

  constructor() { }

  ngOnInit(): void {
  }

}
