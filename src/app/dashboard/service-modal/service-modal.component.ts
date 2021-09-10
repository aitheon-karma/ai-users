import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ServicesService } from '../../services/shared';

@Component({
  selector: 'ai-service-modal',
  templateUrl: './service-modal.component.html',
  styleUrls: ['./service-modal.component.scss']
})
export class ServiceModalComponent implements OnInit {

  @Output() closeServiceModal: EventEmitter<boolean> = new EventEmitter<boolean>();

  allServices: any[];

  constructor(
    private servicesService: ServicesService,
  ) { }

  ngOnInit() {
    localStorage.removeItem('signup-service');
    this.servicesService.list().subscribe(services => {
      this.allServices = services;
    });
  }

  onCloseServiceModal() {
    this.closeServiceModal.emit(true);
  }

  goToService(selectedService: string) {
    this.onCloseServiceModal();
    const service = this.allServices.find((s => s._id.toString() === selectedService));
    if (service) location.href = service.url;
  }

}
