import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AuthService } from '@aitheon/core-client';
import { distinctUntilChanged, debounceTime, filter, switchMap, map, tap } from 'rxjs/operators';
import { UsersService } from '../shared';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'ai-username-form',
  templateUrl: './user-username-form.component.html',
  styleUrls: ['./user-username-form.component.scss']
})
export class UsernameFormComponent implements OnInit {

  userNameControl: FormControl;
  isSubmitted = false;
  available = false;
  checking = false;

  @Output() saved = new EventEmitter<string>();
  @Output() canceled = new EventEmitter();


  constructor(private authService: AuthService, private usersService: UsersService, private toastr: ToastrService) {
    this.userNameControl = new FormControl();
  }

  ngOnInit() {

    this.userNameControl.valueChanges.pipe(
      tap(() => { this.available = false; }),
      debounceTime(350),
      distinctUntilChanged(),
      filter(val => val.trim().length > 2),
      switchMap(val => { this.checking = true; return this.usersService.checkUsername(val.toLowerCase()); })
    ).subscribe(result => {
      this.checking = false;
      if (result.available && !result.invalid) {
        this.available = true;
      }
    });

    this.authService.currentUser.subscribe(user => {
      this.userNameControl.setValue((user.username || `${user.profile.firstName}_${user.profile.lastName}`.toLowerCase()));
    });
  }

  submit() {
    if (this.checking || !this.available) {
      return;
    }

    this.available = false;
    this.usersService.setUsername(this.userNameControl.value).subscribe(() => {
      console.log('success');
      this.toastr.success('Username successfully set');
      this.saved.emit(this.userNameControl.value);
    }, err => this.toastr.error(err.message));

  }

}
