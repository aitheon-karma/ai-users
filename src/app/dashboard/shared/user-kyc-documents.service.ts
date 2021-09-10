import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService } from '@aitheon/core-client';
import { UserKYCDocument } from './user-kyc-document';

@Injectable({providedIn: 'root'})
export class UserKYCDocumentsService {

  constructor(private restService: RestService) { }

  list(): Observable<UserKYCDocument[]> {
    return this.restService.fetch(`/api/users/kyc/documents`);
  }

  savePhotoIDNumber(photoIDNumber: string): Observable<void> {
    return this.restService.post(`/api/users/kyc/documents/photoid`, { photoIDNumber });
  }

}

