import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { AuthService } from '@aitheon/core-client';
import { ProjectsRestService } from '@aitheon/creators-studio';
import { environment } from '../../../../environments/environment';
import { noop } from 'rxjs';

@Component({
  selector: 'fl-widget-creators-studio',
  templateUrl: './widget-creators-studio.component.html',
  styleUrls: ['./widget-creators-studio.component.scss']
})
export class WidgetCreatorsStudioComponent implements OnInit {
  @Output() automateConfirm: EventEmitter<any> = new EventEmitter<any>();

  projects: any[];
  user: any;

  constructor(
    private authService: AuthService,
    private projectsRestService: ProjectsRestService,
  ) { }

  loading = false;

  ngOnInit() {
    this.authService.activeOrganization.subscribe((org: any) => {
      if (!environment.production && org) {
        this.projectsRestService.defaultHeaders = this.projectsRestService.defaultHeaders.set('organization-id', org._id);
      }
      this.projectsRestService.recent().subscribe((projects: any[]) => {
        this.projects = projects;
      },
      err => noop);
    });


    this.authService.currentUser.subscribe((user: any) => {
        this.user = user;
      });
  }

  openRecentProject(project: any) {

  }

  goToCreator() {
    window.location.href = '/creators-studio/dashboard';
  }

  goToAutomateConfirm() {
    let requestInfo: {type: string, source: string} = {
      type: 'Early access',
      source: 'dashboard'
    };

    this.automateConfirm.emit({ user: this.user, service: 'CREATORS_STUDIO', requestInfo });
  }
}
