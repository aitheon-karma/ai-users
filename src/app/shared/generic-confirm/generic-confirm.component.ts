import { Component, OnInit, ViewChild, Input, TemplateRef } from '@angular/core';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';

export interface ModalData {
  text: string;
  hideNoButton?: boolean;
  confirmText?: string;
  headlineText?: string;
  callback?: any;
  cancelText?: string;
  showInput?: boolean;
  inputTitleText?: string;
}

@Component({
  selector: 'fl-generic-confirm',
  templateUrl: './generic-confirm.component.html',
  styleUrls: ['./generic-confirm.component.scss']
})
export class GenericConfirmComponent implements OnInit {
  @ViewChild('formModal') formModal: TemplateRef<any>;

  @Input() showCancel: boolean = true;
  @Input() membersConfirm: boolean;
  @Input() teamsConfirm: boolean;

  data: ModalData = {} as ModalData;
  modalRef: BsModalRef;
  description: string;

  public isDescriptionValid: boolean = true;
  public descriptionErrorMessage: string = '';

  constructor(private modalService: BsModalService) {
  }

  ngOnInit() {
  }

  hide() {
    this.modalRef.hide();
  }

  onConfirm() {
    if (this.data.showInput) {
      this.isDescriptionValid = this.isDescriptionFieldValid();
    }

    if (!this.isDescriptionValid) {
      this.descriptionErrorMessage = this.getDescriptionErrorMessage();
    } else {
      this.hide();

      if (this.data.callback) {
        this.data.callback(this.description);
      }

      this.description = '';
    }
  }

  show(data: ModalData) {
    this.data = data;
    this.modalRef = this.modalService.show(this.formModal, Object.assign({ class: 'custom-confirm'}));
  }

  cancel() {
    this.modalRef.hide();
  }

  public resetErrorState(): void {
    this.isDescriptionValid = true;
    this.descriptionErrorMessage = '';
  }

  private isDescriptionFieldValid(): boolean {
    const description = this.description.trim();

    return description.length > 10;
  }

  private getDescriptionErrorMessage(): string {
    const description: string = this.description.trim();
    let errorMessage: string = '';

    if (!this.isDescriptionValid) {
      errorMessage = (description.length === 0)
        ? 'Description is required'
        : 'The minimum number of characters must be 10';
    }

    return errorMessage;
  }
}
