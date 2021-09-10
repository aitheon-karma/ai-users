import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService } from '@aitheon/core-client';

import { File } from './file';

@Injectable({providedIn: 'root'})
export class FilesService {

  constructor(private restService: RestService) { }

  list(organizationId: string): Observable<File[]> {
    return this.restService.fetch(`/api/organizations/${ organizationId }/files`);
  }

  remove(organizationId: string, fileId: string): Observable<void> {
    return this.restService.delete(`/api/organizations/${ organizationId }/files/${ fileId }`);
  }

}
