import { SweetAlert2Module } from '@sweetalert2/ngx-sweetalert2';
import { NgModule } from '@angular/core';
import { TeamsListComponent } from './teams-list/teams-list.component';
import { TeamFormComponent } from './team-form/team-form.component';
import { SharedModule } from './../shared/shared.module';
import { CoreClientModule } from '@aitheon/core-client';
import { TooltipModule } from 'ngx-tooltip';

@NgModule({
  imports: [
    CoreClientModule,
    SharedModule,
    SweetAlert2Module,
    TooltipModule
  ],
  exports: [
    TeamFormComponent,
    TeamsListComponent
  ],
  declarations: [
    TeamFormComponent,
    TeamsListComponent
  ]
})
export class TeamsModule { }
