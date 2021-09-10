import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { AdminUserTypesListComponent } from './admin-user-types-list/admin-user-types-list.component';
import { UserType } from './shared/user-type';
import { DashboardService } from 'app/dashboard/shared';

@Component({
  selector: 'ai-admin-user-types',
  templateUrl: './admin-user-types.component.html',
  styleUrls: ['./admin-user-types.component.scss']
})
export class AdminUserTypesComponent implements OnInit {

  @ViewChild('adminUserTypesListComponent') adminUserTypesListComponent: AdminUserTypesListComponent;

  modalRef: BsModalRef;
  editTypeId: string;
  widgets: any[] = [];

  constructor( private modalService: BsModalService, private dashboardService: DashboardService) {
    this.dashboardService.getAllWidgets().subscribe(widgets => {
      this.widgets = widgets;
    });
  }

  ngOnInit() {

  }


  openModal(template: TemplateRef<any>, editTypeId: string = null) {
    this.editTypeId = editTypeId;
    this.modalRef = this.modalService.show(template);
  }


  closeModal() {
    this.modalRef.hide();
  }

  onSavedType(type: UserType) {
    this.adminUserTypesListComponent.onSaveType(type);
  }

  deleted() {
    this.adminUserTypesListComponent.refresh();
    this.closeModal();
  }

}
