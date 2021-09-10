import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { ServicesService } from '../services.service';
import { Service } from '../service';

@Component({
  selector: 'ai-all-service-list',
  templateUrl: './all-service-list.component.html',
  styleUrls: ['./all-service-list.component.scss']
})
export class AllServiceListComponent implements OnInit {

  constructor(private serviceService: ServicesService) { }

  @Output() serviceSelected = new EventEmitter<Service>();

  allServices: Service[];
  selectedService: Service;

  ngOnInit() {
    this.serviceService.list()
    .subscribe(result => {
     this.allServices = result;
    });
  }


  selectService(service: Service) {
    this.selectedService = service;
    this.serviceSelected.emit({...service});
  }


}
