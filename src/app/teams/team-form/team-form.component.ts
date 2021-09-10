import { ToastrService } from 'ngx-toastr';
import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators, NgForm, FormArray} from '@angular/forms';
import { TeamsService } from './../shared/teams.service';
import { Team } from './../shared/team';
import { Service } from './../../services/shared/service';

@Component({
  selector: 'fl-team-form',
  templateUrl: './team-form.component.html',
  styleUrls: ['./team-form.component.scss']
})
export class TeamFormComponent implements OnInit, OnChanges {

  @Input() team: Team;
  @Input() organizationId: string;
  @Input() services: Service[];
  @Output() cancel: EventEmitter<any> = new EventEmitter<any>();
  @Output() saved: EventEmitter<Team> = new EventEmitter<Team>();
  @Output() deleted: EventEmitter<Team> = new EventEmitter<Team>();

  submitted = false;
  teamForm: FormGroup;
  error: any;

  get isNew() {
    return this.team && !this.team._id;
  }

  constructor(
     private fb: FormBuilder,
     private toastr: ToastrService,
     private teamsService: TeamsService,
  ) { }

  ngOnInit() {
    if (this.team) {
      this.buildForm(this.team);
    } else {
      this.teamForm = null;
    }
  }

  ngOnChanges() {
    if (this.team) {
      this.buildForm(this.team);
    }
  }

  buildForm(team: Team) {
    this.teamForm = this.fb.group({
      name: [team.name || '', [ Validators.required, Validators.maxLength(30) ]],
      services: this.fb.array(team.services.map((s: { service: string, role: string }) => this.fb.group({
        service: [s.service],
        role: [s.role]
      })))
    });
  }

  onSubmit({ value, valid }: { value: Team, valid: boolean }): void {
    this.submitted = true;
    if (!valid) {
      return;
    }
    const org = Object.assign(this.team, value);

    if (this.isNew) {
      this.create(org);
    } else {
      this.update(org);
    }
  }

  create(team: Team): void {
    this.teamsService.create(this.organizationId, team).subscribe((x: Team) => {
      this.team._id = x._id;
      this.teamForm.reset();
      this.submitted = false;
      this.toastr.success('Team has been successfully created');
      this.saved.emit(x);
    }, (error) => this.handleError(error));
  }

  update(team: Team): void {
    this.teamsService.update(this.organizationId, team).subscribe((x: Team) => {
      this.teamForm.reset();
      this.submitted = false;
      this.toastr.success('Team updated');
      this.saved.emit(x);
    }, (error) => this.handleError(error));
  }


  handleError(error: any) {
    this.error = error;
  }

  cancelClick() {
    this.teamForm.reset(this.team);
    this.submitted = false;
    this.cancel.emit();
  }

  onDeleteTeam(team: Team): void {
    this.deleted.emit(this.team);
  }
}
