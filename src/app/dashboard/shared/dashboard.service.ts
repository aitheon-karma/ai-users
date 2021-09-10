import { Observable } from 'rxjs';
import { Injectable } from '@angular/core';
import { RestService, ApplicationType, GraphData } from '@aitheon/core-client';
import { environment } from 'environments/environment';

import { Settings } from './settings';
import { News } from './news';
import { Widget } from './widget';
import { DashboardSettings } from './dashboard-settings';
import { Tutorial } from './tutorial';
import { map } from 'rxjs/operators';

@Injectable({providedIn: 'root'})
export class DashboardService {

  constructor(private restService: RestService) { }

  get(): Observable<Settings> {
    return this.restService.fetch(`/api/dashboard/settings`);
  }

  getDashboardSettings(): Observable<DashboardSettings> {
    return this.restService.fetch(`/api/dashboard/dashboard-settings`);
  }

  skipWelcomeVideo(id: string): Observable<void> {
    return this.restService.put(`/api/dashboard/dashboard-settings/${id}`, {skipWelcomeVideo: true});
  }

  toggleServiceMap(id: string, hideServiceMap: boolean): Observable<void> {
    return this.restService.put(`/api/dashboard/dashboard-settings/${id}`, { hideServiceMap });
  }

  getNews(page: Number): Observable<{ count: Number, news: News[] }> {
    return this.restService.fetch(`/api/dashboard/news`, { page });
  }

  getWidgets(): Observable<{ widgets: Widget[], settings: DashboardSettings }> {
    return this.restService.fetch(`/api/dashboard/widgets`);
  }

  getAllWidgets(): Observable<any[]> {
    return this.restService.fetch('/api/dashboard/widgets/all');
  }

  getTutorials(): Observable<Tutorial[]> {
    return this.restService.fetch(`/api/dashboard/tutorials`);
  }

  saveWidget(widget: Widget): Observable<Widget> {
    return this.restService.post(`/api/dashboard/widgets`, widget);
  }

  removeWidget(widgetId: String): Observable<void> {
    return this.restService.delete(`/api/dashboard/widgets/${ widgetId }`);
  }

  sendFeatureRequest(service: string, description: string, requestInfo: {type: string, source: string}): Observable<void> {
    return this.restService.post(`/api/dashboard/request/feature`, { service, description, type: requestInfo.type, source: requestInfo.source });
  }

  getProfileConnections(): Observable<any> {
    return this.restService.post(`${environment.baseApi}${environment.contactsUrl}/api/contacts/connections`, {}, true);
  }

  getOrganizationStats(fromDate: Date, toDate: Date): Observable<any> {
    const url = '/api/dashboard/organization/stats';
    const queryParams = `?fromDate=${fromDate.toISOString()}&toDate=${toDate.toISOString()}`;
    return this.restService.fetch(url.concat(queryParams)) ;
  }

  getOrgGraphApplications(applicationType: ApplicationType | ApplicationType[]): Observable<any> {
    const url = `${environment.baseApi}${environment.systemGraphUrl}/api/graphs/organization/graph`;
    return this.restService.fetch(url, undefined, true).pipe(map(graph => {
      return this.getApplicationsDataFromGraph(graph, applicationType);
    }));
  }

  // Duplicate from CC
  private getApplicationsDataFromGraph(graph: any, applicationType: ApplicationType | ApplicationType[]): GraphData {
    if (!graph) {
      return null;
    }

    const { graphNodes = [] } = graph as any;
    let applications = graphNodes.filter(graphNode => graphNode?.node?.project?.projectType || graphNode?.release?.project?.projectType)
      .map(graphNode => ({
        isLatest: graphNode?.isLatest,
        graphNodeId: graphNode._id,
        device: graphNode?.device,
        status: graphNode?.status,
        version: graphNode?.release?.tag,
        uiElements: graphNode.uiElements || [],
        project: typeof graphNode.release.project === 'object' ? graphNode.release.project : graphNode.node.project
      }));
    if (applicationType) {
      applications = applications.filter(app => {
        if (Array.isArray(applicationType)) {
          return applicationType.includes(app.project?.projectSubType) ||
            applicationType.includes(app.project?.projectType);
        }
        return app.project?.projectSubType?.includes(applicationType) ||
          app.project?.projectSubType?.includes(applicationType);
      });
    }
    return {
      service: graph.service,
      graphId: graph._id,
      applications,
      status: graph.status
    };
  }
}

