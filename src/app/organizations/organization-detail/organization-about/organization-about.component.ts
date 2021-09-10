import { Component, OnInit, Input, TemplateRef, ViewChild, ElementRef } from '@angular/core';
import { Organization, OrganizationsService } from '../../shared';
import { FileUploader, FileItem } from 'ng2-file-upload';
import { AuthService } from '@aitheon/core-client';
import { ToastrService } from 'ngx-toastr';
import { Address } from '../../../shared/Location';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import { Team } from "../../../teams/shared";
import { Service } from "../../../services/shared";
import {User, UserRole} from "../../../users/shared";
import { forkJoin } from "rxjs";

@Component({
  selector: 'fl-organization-about',
  templateUrl: './organization-about.component.html',
  styleUrls: ['./organization-about.component.scss']
})
export class OrganizationAboutComponent implements OnInit {
  membersList: any[] = [];
  membersListCopy: any[] = [];
  memberModalTitle: string;
  uploader: FileUploader;
  authToken: string;
  uploadingAvatar = false;
  avatarUrl: string;
  loading = false;
  address: Address;
  modalRef: BsModalRef;
  selectedTeam: Team;
  currentMemberEdit: User;
  memberPickFormModal: BsModalRef;
  memberFormModal: BsModalRef;
  ignoreMembersEmails: string[];
  invitedMemberList: User[] = [];
  searchText = '';
  loadingIds: string[] = [];
  filteredInviteMembers: User[];
  filteredMembers: User[] = [];
  tabState: any = 1;
  locationModalRef: BsModalRef;
  selectedLocation: any;
  loadingList = false;
  allMembersCount = 'All Members';
  allTeamsCount = 'Members by teams';
  loadingMembers: boolean;
  orgRole: UserRole;
  teamsArr: {
    teamName: string,
    isOpen: boolean,
    members: any[]
  }[];

  constructor(private authService: AuthService,
    private toastr: ToastrService,
    private modalService: BsModalService,
    private organizationsService: OrganizationsService
  ) { }

  @ViewChild('avatarImage') avatarImage: ElementRef;
  @ViewChild('teamModal') public teamModal: TemplateRef<any>;
  @ViewChild('memberPickModal') memberPickFormTemplate: TemplateRef<any>;
  @ViewChild('memberFormModal') memberFormTemplate: TemplateRef<any>;
  @ViewChild('locationModal') locationModal: TemplateRef<any>;
  @Input() teams: Array<Team>;
  @Input() services: Array<Service>;
  @Input() organization: Organization;

  ngOnInit() {

    if (!this.organization.profile) {
      (this.organization.profile as {}) = {};
    }

    this.uploadInit();
    this.getMembers();
  }

  private uploadInit() {
    this.authService.token.subscribe((token: string) => {
      this.authToken = token;
    });

    const xBase = (document.getElementsByTagName('base')[0] || { href: '/' }).href;
    const url = `${this.stripTrailingSlash(xBase)}/api/organizations/${this.organization._id}/public-profile/avatar`;
    this.initUploader(url);


    this.uploader.onBeforeUploadItem = () => {
      this.uploadingAvatar = true;
    };
  }

  private stripTrailingSlash = (str: string) => {
    return str.endsWith('/') ? str.slice(0, -1) : str;
  }

  initUploader(baseUrl: string): void {
    this.uploader = new FileUploader({
      url: baseUrl,
      method: 'POST',
      authToken: 'JWT ' + this.authToken,
      autoUpload: false,
      maxFileSize: 3*1024*1024,
    });

    this.uploader.onWhenAddingFileFailed = (item: any, filter: any, options: any) => {
      if ((item.size / 1024 / 1024) > 3) {
        this.toastr.error("File can't be bigger than 3MB");
      }
      this.uploader.clearQueue();
    };

    this.uploader.onAfterAddingFile = (item: FileItem) => {
      item.upload();
    };

    this.uploader.onErrorItem = (fileItem: FileItem, response: any, status: any) => {
      this.uploadingAvatar = false;
      try {
        response = JSON.parse(response);
        response = response.message;
      } catch (err) { }
      fileItem.remove();
      this.toastr.error(`${fileItem.file.name} ${response} `, `Upload error (${status}) `);
    };

    this.uploader.onSuccessItem = (fileItem: FileItem, response: any) => {
      this.uploadingAvatar = false;
      response = JSON.parse(response);
      this.avatarUrl = response.profile.avatarUrl;

      // this.authService.refreshAvatar(res);
      this.toastr.success('Avatar updated.');
      this.uploader.clearQueue();
    };
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template);
  }

  onOrgUpdate(org: Organization) {
    this.updateOrg(org);
  }

  updateOrg(organization: Organization): void {
    this.loading = true;
    this.organization = organization;
    this.modalRef.hide();
  }

  handleError(response: any) {
    try {
      response = JSON.parse(response);
      response = response.message;
    } catch (err) { }
  }

  getMembers() {
    this.loadingMembers = true;
    this.organizationsService.getMembers(this.organization._id).subscribe((res: any) => {
      if (!res.hasOwnProperty('message')) {
        this.membersList = this.membersListCopy = res;
        this.loadingMembers = false;
        this.allMembersCount = this.membersList?.length ? `All Members (${this.membersList.length})` : 'All Members';
        this.setTeams();
        this.sortMembersByTeam();
      }
    });
  }

  openLocationModal(location: any = {}) {
    this.selectedLocation = location;
    this.locationModalRef = this.modalService.show(this.locationModal, {
      backdrop: 'static',
      ignoreBackdropClick: true,
      class: 'organization-modal'
    });
  }

  updateLocationsList(message: string) {
    this.loadingList = true;

    this.organizationsService.getAllLocations(this.organization._id).subscribe(locations => {
      this.organization.locations = locations;
      this.loadingList = false;
    })

    this.locationModalRef.hide();
    setTimeout(() => this.toastr.success(message), 1000);
  }

  addTeam() {
    this.selectedTeam = new Team();
    this.modalRef = this.modalService.show(this.teamModal, Object.assign({ class: 'organization-modal'}));
  }

  onCancel() {
    this.modalRef.hide();
    this.selectedTeam = null;
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

  memberSelected(member: User) {
    this.currentMemberEdit = member;
    this.memberPickFormModal?.hide();
    this.memberModalTitle = this.currentMemberEdit._id && !this.currentMemberEdit['newInvite'] ?
      `${ member?.profile?.firstName } ${ member?.profile?.lastName } in ${this.organization.name}` :
      'Add new member';
    this.memberFormModal = this.modalService.show(this.memberFormTemplate, Object.assign({}, { class: 'organization-modal'}));
  }

  closeMembersFormModal() {
    this.memberFormModal.hide();
  }

  closeMemberPickModal() {
    this.memberPickFormModal.hide();
  }

  openMemberPickModal() {
    this.currentMemberEdit = null;
    this.ignoreMembersEmails = (this.membersList.map(u => u.email.toLowerCase())).concat(this.invitedMemberList.map(u => u.email.toLowerCase()));
    this.memberPickFormModal = this.modalService.show(this.memberPickFormTemplate, Object.assign({}, { class: 'organization-modal'}));
  }

  memberSaved() {
    this.memberFormModal.hide();
    this.loadMembersAndInvites();
    this.getMembers();
  }

  loadMembersAndInvites() {
    this.loadingIds = [];
    const member$ = this.organizationsService.getMembers(this.organization._id);
    const invites$ = this.organizationsService.getInvitedUsers(this.organization._id);

    forkJoin([member$, invites$]).subscribe(result => {
      this.membersList = result[0];
      this.invitedMemberList = result[1];
      this.filteredMembers = result[0];
      this.filteredInviteMembers = result[1];
      this.loading = false;

      this.searchText = '';
    }, err => this.handleError(err));
  }

  switchTab(tabIndex: number) {
    this.tabState = tabIndex;
  }

  searchMembers(value: string) {
    this.membersListCopy = [...this.membersList].filter(member => {
      return (member.profile.firstName?.toLowerCase().includes(value.toLowerCase()) || member.profile?.lastName.toLowerCase().includes(value.toLowerCase()));
    });
  }

  private setTeams() {
    this.membersList.map(member => {
      // this.orgRole = member.roles ? member.roles.find(r => r.organization === this.organization._id) : null;
      // member.teams = (this.orgRole && this.orgRole.services) ? this.teams.filter(t => this.orgRole.teams.includes(t._id)) : [];

      let roles = member.roles ? member.roles.find(r => r.organization === this.organization._id) : null;
      member.teams = roles && roles.teams.length ? this.teams.filter(t => roles.teams[0]._id === t._id) : [];
    });
  }

  sortMembersByTeam() {
    this.teamsArr = [];

    this.teams.map(team => {
      this.teamsArr.push({
        teamName: team.name,
        isOpen: false,
        members: []
      });
    });

    this.membersList.forEach(member => {
      this.teamsArr.map(team => {
        if (member.teams?.length && (member?.teams[0].name === team.teamName)) {
          team.members.push(member);
        }
      })
    });
    this.allTeamsCount = this.teamsArr?.length ? `Members by teams (${this.teamsArr.length})` : 'Members by teams';
  }
}
