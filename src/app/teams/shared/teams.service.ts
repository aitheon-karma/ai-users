import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService } from '@aitheon/core-client';

import { Team } from './team';

@Injectable({providedIn: 'root'})
export class TeamsService {

  constructor(private restService: RestService) { }


  list(organizationId: string): Observable<Team[]> {
    return this.restService.fetch(`/api/organizations/${ organizationId }/teams`);
  }

  create(organizationId: string, team: Team): Observable<Team> {
    return this.restService.post(`/api/organizations/${ organizationId }/teams`, team);
  }

  update(organizationId: string, team: Team): Observable<Team> {
    return this.restService.put(`/api/organizations/${ organizationId }/teams/${ team._id }`, team);
  }

  remove(organizationId: string, teamId: string): Observable<Team> {
    return this.restService.delete(`/api/organizations/${ organizationId }/teams/${ teamId }`);
  }

}
