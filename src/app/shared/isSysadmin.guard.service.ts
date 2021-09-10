import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '@aitheon/core-client';
import { map } from 'rxjs/internal/operators/map';
import { catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class IsSysadminGuardService implements CanActivate {

  constructor(public authService: AuthService, public router: Router) {}

  canActivate() {
   return this.authService.currentUser.pipe(map(user => {
      if (user.sysadmin) {
        return true;
      } else {
        this.router.navigate(['/dashboard']);
        return false;
      }
    }), catchError(err => Observable.of(true)));
  }
}
