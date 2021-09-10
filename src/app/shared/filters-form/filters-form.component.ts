import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Team, TeamsService } from "../../teams/shared";
import { Subscription } from 'rxjs';

@Component({
  selector: 'ai-filters-form',
  templateUrl: './filters-form.component.html',
  styleUrls: ['./filters-form.component.scss']
})
export class FiltersFormComponent implements OnInit {

  @Input() filterType: string;
  @Input() organizationId: string;

  @Output() filtersChanged: EventEmitter<{name: string, value: string}> = new EventEmitter<{name: string, value: string}>();

  public filtersForm: FormGroup;
  public teams: Team[];
  public roles = ['User', 'OrgAdmin', 'SuperAdmin', 'Owner'];
  public statuses = ['Active', 'Invited'];

  private filterFields: any;
  private subscriptions$: Subscription = new Subscription();

  private FILTERS: any = {
    MEMBERS: {
      team: [],
      organizationRole: [],
      status: []
    }
  };

  constructor(
    private fb: FormBuilder,
    private teamsService: TeamsService
  ) {
  }

  ngOnInit(): void {
    this.buildForm();

    this.fetchTeamsList();
  }

  private buildForm(): void {
    this.filterFields = this.getFilterFields();
    this.filtersForm = this.fb.group(this.filterFields);

    this.setControlListeners();
  }

  private getFilterFields(): any {
    return this.FILTERS[this.filterType];
  };

  private fetchTeamsList(): void {
    this.subscriptions$.add(
      this.teamsService.list(this.organizationId)
        .subscribe((teams: Team[]) => {
          this.teams = teams;
        })
    )
  }

  private setControlListeners(): void {
    let filterKeys = Object.keys(this.filtersForm.controls);

    filterKeys.forEach(key => {
      const filterKey = key;
      let filterValue = this.filtersForm.controls[filterKey];

      filterValue.valueChanges
        .subscribe(value => {
          this.filtersChanged.emit({name: filterKey, value: value});
        });
    });
  }
}
