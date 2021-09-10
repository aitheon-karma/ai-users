import { GenericConfirmComponent } from '../../shared/generic-confirm/generic-confirm.component';
import { ToastrService } from 'ngx-toastr';
import { Component, OnInit, Input, ViewChild, TemplateRef, ChangeDetectorRef } from '@angular/core';
import { Team } from '../shared';
import { Service } from '../../services/shared';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { OrganizationsService } from "../../organizations/shared";
import { UserRole } from "../../users/shared";
import { TeamsService } from '../shared';

@Component({
  selector: 'fl-teams-list',
  templateUrl: './teams-list.component.html',
  styleUrls: ['./teams-list.component.scss'],
})
export class TeamsListComponent implements OnInit {
  @ViewChild('teamModal') public teamModal: TemplateRef<any>;
  @ViewChild('genericConfirm') genericConfirm: GenericConfirmComponent;

  @Input() organization: any;
  @Input() teams: any[];
  @Input() services: Array<Service>;

  loading: boolean = false;
  filteredTeams: any[];
  selectedTeam: any;
  searchText = '';
  modalRef: BsModalRef;
  orgRole: UserRole;
  membersList: any[] = [];
  avatarColors = ['#E96058', '#ED9438', '#F5BA06',
                  '#67B231', '#1AC0C9', '#589BE9',
                  '#6278C4', '#8C58E9', '#CA58E9',
                  '#F39ABA'];

  constructor(private modalService: BsModalService,
              private organizationsService: OrganizationsService,
              private teamsService: TeamsService,
              private toastr: ToastrService,
              private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.loading = true;
    this.filteredTeams = this.teams;

    if (this.teams.length) {
      this.getMembers();
    } else {
      this.loading = false;
    }
  }

  getServiceName(value: { service: string, role: string }): string {
    if (value && value.service) {
      const svc = this.services.find((s: Service) => s._id === value.service);
      return svc ? svc.name : '';
    }
  }

  addTeam() {
    this.selectedTeam = new Team();
    this.modalRef = this.modalService.show(this.teamModal, Object.assign({ class: 'organization-modal' }));
    this.filteredTeams = this.teams;
  }

  edit(team: Team) {
    this.selectedTeam = team;
    this.modalRef = this.modalService.show(this.teamModal, Object.assign({ class: 'organization-modal' }));
  }

  deleteTeam(team: Team) {
    this.genericConfirm.show({
      text: `Are you sure you want to remove "${team.name}" team from organization?`,
      headlineText: `Remove "${team.name}" from ${ this.organization.name }`,
      confirmText: 'Remove',
      cancelText: 'Cancel', callback: () => {
        this.teamsService.remove(this.organization._id, team._id).subscribe((x: Team) => {
          this.toastr.success(`"${team.name}" removed`);
          const index = this.teams.findIndex((t: Team) => t._id === team._id);
          this.teams.splice(index, 1);
        });
    }});
  }

  onCancel() {
    this.modalRef.hide();
    this.selectedTeam = null;
  }

  onDeleted(team: Team) {
    this.modalRef.hide();
    this.filteredTeams = this.teams;
  }

  onSaved(team: Team) {
    this.selectedTeam = null;
    this.modalRef.hide();
    const index = this.teams.findIndex((t: Team) => t._id === team._id);
    if (index === -1) {
      this.teams.push(team);
    } else {
      Object.assign(this.teams[index], team);
    }
  }

  onModalHidden() {
    this.selectedTeam = null;
  }

  onSearchTextChange() {
    let timeOut = setTimeout(() => {
      if (!this.searchText || this.searchText.trim() === '') {
        this.searchText = '';
        this.filteredTeams = this.teams;
        return;
      }

      this.filteredTeams = this.teams.filter(t =>  {
        if (t.name.toLowerCase().includes(this.searchText.toLowerCase())) {
          return t;
        }
      });
      clearTimeout(timeOut);
    })
  }

  getMembers() {
    this.organizationsService.getMembers(this.organization._id).subscribe((res: any) => {
      this.membersList = res;

      this.membersList.map(member => {
        let roles = member.roles ? member.roles.find(r => r.organization === this.organization._id) : null;
        member.teams = roles && roles.teams.length ? this.teams.filter(t => roles.teams[0]._id === t._id) : [];
      });

      this.filteredTeams = this.teams = this.teams.map(team => {
        const updatedTeam = {...team, members: []};
        this.membersList.forEach(member => {
          if (member.teams?.length && (member?.teams[0].name === team.name)) {
            updatedTeam.members.push(member);
          }
        });
        return updatedTeam;
      });
      this.loading = false;
    });
  }

  getRandomColor(index: number) {
    return this.avatarColors[index % this.avatarColors.length];
  }

  getInitials(name) {
    return ((name).substr(0, 2)).toUpperCase();
  }

  getOtherAssignees(members: any) {
    let arr = [];
    members.slice(5).forEach((member: any) => {
      const fullName = member.profile.firstName + ' ' + member.profile.lastName;
      arr.push(fullName);
    });
    let editedArr = arr.join(', ');
    return editedArr
  }

  getServicesTooltipInfo(services: any[]) {
    let arr = [];
    services.slice(0, 5).forEach((service: any) => {
      const serviceName = service.service.replace('_', ' ');
      arr.push(serviceName.toLowerCase());
    });
    let editedArr = arr.join(', ');
    return editedArr
  }
}
