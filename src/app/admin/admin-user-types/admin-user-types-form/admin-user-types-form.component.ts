import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserType } from '../shared/user-type';
import { UserTypeService } from '../shared/user-types.service';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { DashboardService } from '../../../dashboard/shared';

@Component({
  selector: 'ai-admin-user-types-form',
  templateUrl: './admin-user-types-form.component.html',
  styleUrls: ['./admin-user-types-form.component.scss']
})
export class AdminUserTypesFormComponent implements OnInit {

  @Output() closeModal: EventEmitter<any> = new EventEmitter<any>();
  @Output() onSaved: EventEmitter<UserType> = new EventEmitter<UserType>();
  @Input() editTypeId: string;
  @Output() deleted = new EventEmitter<any>();
  @Input() widgets = [];


  typesForm: FormGroup;
  submitted = false;
  loading = false;
  type: UserType;

  constructor(
    private fb: FormBuilder,
    private userTypeService: UserTypeService,
    private toastr: ToastrService,
    private dashboardService: DashboardService
  ) { }

  async ngOnInit() {
    if (this.editTypeId) {
      this.type = await this.userTypeService.getById(this.editTypeId).toPromise();
    } else {
      this.type = new UserType();
    }
    this.typesForm = this.fb.group({
      displayText: [this.type.displayText, [Validators.required, Validators.maxLength(40)]],
      description: [this.type.description],
      image: [this.type.image, Validators.required],
      widgets: [this.type.widgets]
    });

  }

  onCloseEditModal() {
    this.typesForm.reset();
    this.closeModal.emit();
  }

  async saveChanges() {
    this.submitted = true;
    this.loading = true;
    if (!this.typesForm.valid) {
      this.loading = false;
      return;
    }
    const displayText = this.typesForm.controls['displayText'].value;
    const id = this.generateId(displayText);
    const newType = Object.assign({} as UserType, this.typesForm.value);
    newType._id = this.editTypeId ? this.editTypeId : id;

    let result;
    try {
      if (this.editTypeId) {
        result = await this.userTypeService.update(newType).toPromise();
        this.toastr.success('Type updated');
      } else {
        result = await this.userTypeService.create(newType).toPromise();
        this.toastr.success('Type created');
      }
      this.onSaved.emit(result);
      this.typesForm.reset();
    } catch (err) {
      this.toastr.error(err);
    }
    this.submitted = false;
    this.loading = false;
    this.onCloseEditModal();
  }

  generateId(displayText: string) {
    return displayText.toUpperCase().trim().replace(/\s+/g, '_');
  }

  deleteUserType(userTypeId: string) {
    // @ts-ignore
    Swal.fire({
      title: 'Are you sure?',
      text: 'This cannot be undone',
      type: 'warning',
      showCancelButton: true,
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Confirm',
      customClass: {
        container: 'modal',
        popup: 'modal-content',
        header: 'modal-header',
        title: 'title-del-modal modal-title pull-left',
        closeButton: 'close-button-del-acc',
        content: 'content-del-acc modal-body',
        actions: 'actions-del-modal justify-content-end align-content-center',
        confirmButton: 'btn btn-primary btn-medium',
        cancelButton: 'btn btn-outline btn-medium mr-2',
        icon: 'icon-del-acc'
      },
      buttonsStyling: false
    }).then((result) => {
      if (!result.value)  { return; }
        this.userTypeService.remove(userTypeId).subscribe(() => {
        this.toastr.success('User type removed');
        this.deleted.emit(true);

      }, err => this.toastr.error(err.message || err));

    });
  }

}
