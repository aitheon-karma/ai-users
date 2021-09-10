import { ToastrService } from 'ngx-toastr';
import { UsersService } from './../shared/users.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { EmailValidators } from 'ng2-validators';
import { User } from '../shared';
import { Team } from './../../teams/shared/team';
import { Service } from './../../services/shared/service';

@Component({
  selector: 'fl-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {
  @ViewChild('userModal') public userModal: ModalDirective;
  @Input() users: User[];
  @Input() invites: Array<User>;
  @Input() services: Service[];
  @Input() teams: Team[];

  @Input() organizationId: string;

  searchForm: FormGroup;
  selectedUser: User;
  showUserForm = false;
  foundUser = false;
  submitted = false;
  isEdit = false;

  error: any;
  loading: boolean;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private usersService: UsersService
  ) { }

  ngOnInit() {
    this.loading = false;
    this.buildForm();
  }

  buildForm() {
     this.searchForm = this.fb.group({
      email: ['', [Validators.required, EmailValidators.normal]],
    });
  }

  onSearchSubmit({ value, valid }: { value: { email: string }, valid: boolean }) {
    this.submitted = true;
    this.error = null;
    if (!valid) {
      return;
    }

    this.loading = true;
    value.email = value.email.toLowerCase();
    this.searchForm.disable();
    this.search(value);
  }

  search(value: { email: string }) {
    this.usersService.search(value).subscribe((users: User[]) => {
      this.loading = false;
      this.searchForm.enable();
      this.searchForm.reset();
      if (users.length === 0) {
        this.foundUser = false;
        this.selectedUser = new User();
        this.selectedUser.email = value.email;
      } else {
        this.selectedUser = users[0];
        this.foundUser = true;
      }
      this.showUserForm = true;
    }, (error) => this.handleError(error));
  }

  handleError(error: any) {
    this.error = error;
    this.loading = false;
    this.searchForm.enable();
  }

  edit(user: User): void {
    this.selectedUser = user;
    this.showUserForm = true;
    this.isEdit = true;
    this.userModal.show();
  }

  onCancel() {
    this.userModal.hide();
  }

  cancelInvite(invite: { _id: string }) {
    this.usersService.cancelInvite(this.organizationId, invite._id).subscribe(() => {
      const index = this.invites.findIndex((u: User) => u._id === invite._id);
      this.invites.splice(index, 1);
      this.toastr.success('Invitation canlceled');
    }, (err) => {
      this.toastr.error(err);
    });
  }

  onSaved(user: User) {
    this.userModal.hide();
    this.selectedUser = null;
    const index = this.users.findIndex((u: User) => u._id === user._id);
    if (!this.isEdit) {
      this.invites.push(user);
    } else {
      if (index > -1) {
        Object.assign(this.users[index], user);
      }
    }
  }

  onBackToSearch() {
    this.showUserForm = false;
    this.selectedUser = null;
    this.submitted = false;
  }

  onHidden() {
    this.selectedUser = null;
    this.submitted = false;
    this.showUserForm = false;
  }

  addUser(): void {
    this.isEdit = false;
    this.userModal.show();
  }

  onModalHidden() {
    this.selectedUser = null;
  }
}
