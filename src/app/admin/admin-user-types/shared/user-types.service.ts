import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService } from '@aitheon/core-client';
import { UserType } from './user-type';

@Injectable({
  providedIn: 'root'
})
export class UserTypeService {

  constructor(private restService: RestService) { }

  list(): Observable<UserType[]> {
    return this.restService.fetch(`/api/admin/user/types`);
  }

  listAll(): Observable<UserType[]> {
    return this.restService.fetch(`/api/admin/user/types/all`);
  }

  create(userType: UserType): Observable<UserType> {
    return this.restService.post(`/api/admin/user/types`, userType);
  }

  update(userType: UserType): Observable<UserType> {
   return this.restService.put(`/api/admin/user/types/${ userType._id }`, userType);
  }

  getById(userTypeId: string): Observable<UserType> {
    return this.restService.fetch(`/api/admin/user/types/${ userTypeId }`);
  }

  remove(userTypeId: string): Observable<UserType> {
    return this.restService.delete(`/api/admin/user/types/${ userTypeId }`);
  }

}
