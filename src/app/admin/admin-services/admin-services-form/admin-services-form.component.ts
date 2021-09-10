import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { ServicesService } from '../../../services/shared';
import { ToastrService } from 'ngx-toastr';


@Component({
  selector: 'ai-admin-services-form',
  templateUrl: './admin-services-form.component.html',
  styleUrls: ['./admin-services-form.component.scss']
})
export class AdminServicesFormComponent implements OnInit {

  @Input() editService: any;
  @Output() closeModal: EventEmitter<any> = new EventEmitter<any>();
  @Output() onSaved: EventEmitter<any> = new EventEmitter<any>();

  serviceForm: FormGroup;
  submitted = false;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private servicesService: ServicesService,
    private toastr: ToastrService,
  ) { }

  ngOnInit() {

    this.buildForm();
  }

  ngOnChanges() {
    if (this.editService) {
      this.buildForm();
    }
  }

  buildForm() {
    this.serviceForm = this.fb.group({
      description: [this.editService.description],
    });
  }

  onCloseEditModal() {
    this.serviceForm.reset();
    this.closeModal.emit();
  }

  async saveChanges() {
    this.submitted = true;
    this.loading = true;
    if (!this.serviceForm.valid) {
      this.loading = false;
      return;
    }

    try {
     const result = await this.servicesService.update(this.editService._id, this.serviceForm.value).toPromise();
        this.toastr.success('Service updated');
      this.onSaved.emit(result);
      this.serviceForm.reset();
    } catch (err) {
      this.toastr.error(err);
    }
    this.submitted = false;
    this.loading = false;
    this.onCloseEditModal();
  }

}
