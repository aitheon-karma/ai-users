import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { UserType } from '../shared/user-type';
import { UserTypeService } from '../shared/user-types.service';
import { first } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'ai-admin-user-types-list',
  templateUrl: './admin-user-types-list.component.html',
  styleUrls: ['./admin-user-types-list.component.scss']
})
export class AdminUserTypesListComponent implements OnInit {

  @Output() onSelectType: EventEmitter<string> = new EventEmitter<string>();

  userTypes: UserType[];

  constructor(
    private userTypeService: UserTypeService,
    private toaster: ToastrService
  ) { }

  async ngOnInit() {
    try {
      this.userTypes = await this.userTypeService.listAll().pipe(first()).toPromise();
    } catch (err) {
      this.handleError(err);
    }
  }

  onSaveType(type: UserType) {
    const t = this.userTypes.find(t => t._id === type._id);
    if (t) {
      this.userTypes = this.userTypes.map((ut: UserType) => {
        if (ut._id === t._id) {
          ut = type;
        }
        return ut;
      });
      this.userTypes = [...this.userTypes];
    } else {
      this.userTypes = [...this.userTypes, type];
    }
  }

  async refresh() {
    this.userTypes = await this.userTypeService.listAll().pipe(first()).toPromise();
  }

  confirmChangingSwitch(type: UserType) {
    type.isActive = !type.isActive;
    this.userTypeService.update(type).subscribe((res: any) => {}, err => this.handleError(err));
  }

  goToEdit(type: UserType) {
    this.onSelectType.emit(type._id);
  }

  handleError(error: any) {
    this.toaster.error(error.message ? error.message : error);
  }

}
