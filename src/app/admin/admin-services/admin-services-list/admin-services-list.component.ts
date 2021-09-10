import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Service } from '../../../services/shared';

@Component({
  selector: 'ai-admin-services-list',
  templateUrl: './admin-services-list.component.html',
  styleUrls: ['./admin-services-list.component.scss']
})
export class AdminServicesListComponent implements OnInit {

  @Input() services: any[];
  @Output() onSelectService: EventEmitter<string> = new EventEmitter<string>();

  constructor() { }

  ngOnInit() {
  }

  goToEdit(service: any) {
    this.onSelectService.emit(service);
  }

}
