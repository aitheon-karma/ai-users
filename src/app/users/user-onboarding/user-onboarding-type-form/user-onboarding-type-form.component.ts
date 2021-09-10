import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UserTypeService } from 'app/admin/admin-user-types/shared/user-types.service';
import { UserType } from 'app/admin/admin-user-types/shared/user-type';
import { FormGroup, FormControl, FormArray } from '@angular/forms';


const anyOneSelectedValidator = (formArray: FormArray) => {
  const checkedControls = formArray.controls.find(c => c.value.checked);
  if (checkedControls) {
    return null;
  }
  return {noneSelected: true};
};


@Component({
  // tslint:disable-next-line: component-selector
  selector: 'ai-user-onboarding-type-form',
  templateUrl: './user-onboarding-type-form.component.html',
  styleUrls: ['./user-onboarding-type-form.component.scss']
})
export class UserOnboardingTypeFormComponent implements OnInit {

  userTypes: UserType[];
  loading = true;
  submitted = false;
  userTypeForm: FormGroup;

  @Output() selectedUserTypes = new EventEmitter<string[]>();

  constructor(private userTypeService: UserTypeService) { }

  ngOnInit() {
  this.loading = true;
  this.userTypeService.list().subscribe(userTypes => {
    this.userTypes = userTypes;
    if (this.userTypes.length === 0) {
        this.selectedUserTypes.emit([]);
    } else {
      this._buildForm();
    }
  });

  }


  private _buildForm() {
    this.userTypeForm = new FormGroup({
      userTypes: new FormArray(this._genergateUserTypeArray(), anyOneSelectedValidator)
    });
    this.loading = false;
  }

  get userTypesFormArray(): FormArray {
    return this.userTypeForm.get('userTypes') as FormArray;
  }


  private _genergateUserTypeArray(): FormGroup[] {
    const groups = this.userTypes.map(ut => {
      const group = new FormGroup({
        userType: new FormControl(ut),
        checked: new FormControl(false)
      });
      return group;
    });
    return groups;
  }

  selectUserType(control: FormGroup, event: Event) {
    if (control.value.userType._id === 'BUSINESS') {
      const value = control.get('checked').value;
      control.get('checked').setValue(!value);
    }
  }


  onSubmit() {

    if (this.userTypeForm.invalid) {
      return;
    }
    const value = Object.assign({}, this.userTypeForm.value);
    const checkedTypes = (value.userTypes as any[]).filter(ut => ut.checked).map(ut => ut.userType._id);
    this.selectedUserTypes.emit(checkedTypes);

  }

}
