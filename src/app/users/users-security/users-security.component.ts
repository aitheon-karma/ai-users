import { Component, OnInit } from '@angular/core';
import { AuthService } from '@aitheon/core-client';
import { User, UsersService } from '../shared';
import { first } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'ai-users-security',
  templateUrl: './users-security.component.html',
  styleUrls: ['./users-security.component.scss']
})
export class UsersSecurityComponent implements OnInit {

  loading = false;
  isEnabledLoginSecondFactorAuth: boolean;
  currentUser: User;
  emailVerified = false;

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private toastr: ToastrService
  ) { }

  async ngOnInit() {
    this.currentUser = await this.authService.currentUser.pipe(first()).toPromise();
    this.isEnabledLoginSecondFactorAuth = this.currentUser.isEnabledLoginSecondFactorAuth;
    this.emailVerified = this.currentUser.emailVerified;
  }

  onEnableChange(isEnabled: boolean) {

    this.usersService.updateSecurity({isEnabledLoginSecondFactorAuth: isEnabled}).subscribe(() => {
      this.toastr.success('Successfully updated');
    },
    err => this.toastr.error(err.message || err));
  }

  twoFactorClick() {
    if (!this.currentUser.emailVerified) {
      this.isEnabledLoginSecondFactorAuth = false;
      return this.toastr.error('Please verify email first');
    }

  }
}
