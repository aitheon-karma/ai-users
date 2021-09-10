import { Observable } from 'rxjs';
import { RestService } from '@aitheon/core-client';
import { Injectable } from '@angular/core';
import { Service, SERVICE_IGNORE_LIST } from './service';
import { map , filter } from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class ServicesService {

  constructor(
    private restService: RestService
  ) { }

  listByOrganization(orgId: string): Observable<string[]> {
    return this.restService.fetch(`/api/organizations/${ orgId }/services`);
  }

  listPersonal(): Observable<Service[]> {
    return this.restService.fetch('/api/services/personal');
  }

  list(): Observable<Service[]> {
    return this.restService.fetch('/api/services')
    .pipe(map(s => s.sort((ser: Service) => ser.core ? 1 : -1)),
          map(s => s.filter((ser: Service) => !SERVICE_IGNORE_LIST.includes(ser._id))));
  }

  update(serviceId: string, service: any): Observable<Service> {
    return this.restService.put(`/api/services/${serviceId}`, service);
  }

}
