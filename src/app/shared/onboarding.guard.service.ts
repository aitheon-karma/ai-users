import { Injectable } from '@angular/core';
import { Router, CanActivate } from '@angular/router';
import { AuthService } from '@aitheon/core-client';
import { map } from 'rxjs/internal/operators/map';
import { catchError } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OnBoardingGuardService implements CanActivate {

  constructor(public authService: AuthService, public router: Router) {}

  canActivate() {
   return this.authService.currentUser.pipe(map(user => {
      if (!user) {
        return true;
      } else if (!user.onBoarded) {
        this.router.navigate(['/user/onboarding']);
        return false;
      }
      return true;
    }), catchError(err => Observable.of(true)));
  }
}
