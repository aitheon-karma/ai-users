import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService } from '@aitheon/core-client';
import { Organization, OrgDocument } from './organization';
import { environment } from '../../../environments/environment';
import { ProjectType, Project } from './project';

@Injectable({providedIn: 'root'})
export class ProjectsService {

  constructor(private restService: RestService) { }

  listByType(projectType: ProjectType): Observable<Project[]> {
    const url = `${ environment.baseApi }${ environment.creatorsStudioUrl }/api/projects/types/${ projectType }`;
    return this.restService.fetch(url, { publishOnline: true }, true);
  }

  getLogs(projectId: string): Observable<{ total: number, data: Array<any> }> {
    const url = `${ environment.baseApi }${ environment.creatorsStudioUrl }/api/projects/${ projectId }/logs`;
    return this.restService.fetch(url, undefined, true);
  }

}

