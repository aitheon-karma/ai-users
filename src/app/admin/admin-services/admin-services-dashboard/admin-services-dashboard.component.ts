import { Component, OnInit, TemplateRef, Input, ViewChild } from '@angular/core';
import { ServicesService, Service } from '../../../services/shared';
import { ToastrService } from 'ngx-toastr';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AdminServicesListComponent } from '../admin-services-list/admin-services-list.component';

@Component({
  selector: 'ai-admin-services-dashboard',
  templateUrl: './admin-services-dashboard.component.html',
  styleUrls: ['./admin-services-dashboard.component.scss']
})
export class AdminServicesDashboardComponent implements OnInit {

  @ViewChild('adminServicesList') adminServicesList: AdminServicesListComponent;

  services: any[] = [];
  editService: any;
  modalRef: BsModalRef;

  constructor(
    private servicesService: ServicesService,
    private toastr: ToastrService,
    private modalService: BsModalService,
  ) { }

  ngOnInit() {
    this.servicesService.list().subscribe((services) => {
      this.services = services;
    }, err => this.handleError(err));
  }

  handleError(error: any) {
    this.toastr.error( error.message || error);
  }

  openModal(template: TemplateRef<any>, editService: any = null) {
    this.editService = editService;
    this.modalRef = this.modalService.show(template);
  }


  closeModal() {
    this.modalRef.hide();
  }

  onSavedService(service: any) {
    this.services = this.services.map((ut: Service) => {
      if (ut._id === service._id) {
        ut = service;
      }
      return ut;
    });
    this.services = [...this.services];
  }

}
