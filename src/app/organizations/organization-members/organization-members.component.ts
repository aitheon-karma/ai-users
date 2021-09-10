import {Component, OnInit, TemplateRef, Input, ViewChild, HostListener, ElementRef} from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { OrganizationsService } from '../shared';
import { ToastrService } from 'ngx-toastr';
import { User } from '../../users/shared';
import { forkJoin } from 'rxjs';
import { GenericConfirmComponent } from '../../shared/generic-confirm/generic-confirm.component';

interface ModifyUser extends User {
  role?: string,
  status?: string,
  team?: string,
  invite?: any
}

@Component({
  selector: 'fl-organization-members',
  templateUrl: './organization-members.component.html',
  styleUrls: ['./organization-members.component.scss']
})

export class OrganizationEmployeesComponent implements OnInit {
  @HostListener('window:mousewheel', ['$event']) onMouseWheel(event) {
    this.handleMousewheel(event);
  }

  @ViewChild('organizationMembersList') organizationMembersList: ElementRef;
  @ViewChild('genericConfirm') genericConfirm: GenericConfirmComponent;
  @ViewChild('memberFormModal') memberFormTemplate: TemplateRef<any>;
  @ViewChild('memberPickModal') memberPickFormTemplate: TemplateRef<any>;

  @Input() organizationId: string;

  membersList: ModifyUser[] = [];
  invitedMemberList: any[] = [];
  filteredMembers: ModifyUser[] = [];
  filteredInviteMembers: any[];
  memberFormModal: BsModalRef;
  memberPickFormModal: BsModalRef;
  currentMemberEdit: User;
  loading = true;
  ignoreMembersEmails: string[];
  loadingIds: string[] = [];
  searchText: string = '';
  organizationName: string;
  isFiltersOpen: boolean = false;
  activeFilters: Array<{ name: string, value: string }> = [];
  sortForward = true;

  private isModalOpened: boolean = false;

  constructor(private organizationService: OrganizationsService,
    private toastr: ToastrService,
    private modalService: BsModalService) { }

  ngOnInit() {
    this.organizationService.getOrg(this.organizationId).subscribe(res => this.organizationName = res.name);

    this.loadMembersAndInvites();

    this.addModalWatchers();
  }

  onSearchTextChange() {
    let timeOut = setTimeout(() => {
      if (!this.searchText || this.searchText.trim() === '') {
        this.searchText = '';
        this.filteredMembers = [...this.membersList];
        return;
      }

      const text = this.searchText.toLowerCase();

      let textSearchItems = text.split(' ').filter(item => item.length > 0);

      this.findMembersByQueries(textSearchItems);

      clearTimeout(timeOut);
    });
  }

  loadMembersAndInvites() {
    this.loadingIds = [];
    const member$ = this.organizationService.getMembers(this.organizationId);
    const invites$ = this.organizationService.getInvitedUsers(this.organizationId);

    forkJoin([member$, invites$]).subscribe(([membersList, invitesMembersList]) => {
      this.filteredMembers = [...membersList, ...invitesMembersList];

      this.filteredMembers.map(member => {
        member.role = member?.invite?.role ? member?.invite?.role : this.getUserRole(member?.roles);
        member.team = this.getUserTeam(member?.roles);
        member.status = member?.invite ? 'Invited' : 'Active'
      })
      this.membersList = this.filteredMembers;
      this.invitedMemberList = invitesMembersList;
      this.loading = false;
    }, err => this.handleError(err));
  }

  editMember(member: User) {
    this.currentMemberEdit = member;
    this.memberFormModal = this.modalService.show(this.memberFormTemplate, Object.assign({}, { class: 'organization-modal' }));
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
    this.memberPickFormModal = this.modalService.show(this.memberPickFormTemplate, Object.assign({}, { class: 'organization-modal' }));
  }

  memberSaved() {
    this.searchText = '';
    this.memberFormModal.hide();
    this.loadMembersAndInvites();
  }

  removeFormOrg(member: User) {
    this.genericConfirm.show({
      text: `Are you sure you want to remove ${member.profile.firstName} ${member.profile.lastName} from organization?`,
      headlineText: `Remove ${member.profile.firstName} ${member.profile.lastName} from ${this.organizationName}`,
      confirmText: 'Remove',
      cancelText: 'Cancel', callback: () => {
        this.loadingIds.push(member._id);
        this.organizationService.deleteUser(this.organizationId, member._id).subscribe(removeResult => {
          this.loadMembersAndInvites();
          this.toastr.success(`${member.profile.firstName} ${member.profile.lastName} has been removed`);
          this.searchText = '';
        }, (err) => this.handleError(err));
      }
    });
  }

  removeOrgInvite(invitedMember: User) {
    this.loadingIds.push(invitedMember._id);
    this.organizationService.deleteInvite(this.organizationId, invitedMember._id)
      .subscribe(() => {
        this.loadMembersAndInvites();
        this.toastr.success(`Invite removed`);
        this.searchText = '';
      }, (err) => this.handleError(err));
  }

  memberSelected(member: User) {
    this.currentMemberEdit = member;
    this.memberPickFormModal.hide();
    this.memberFormModal = this.modalService.show(
      this.memberFormTemplate,
      Object.assign({}, { class: 'organization-modal' })
    );
  }

  isMemberLoading(id: string) {
    return !this.loadingIds.includes(id);
  }

  handleError(error: any) {
    this.toastr.error(error.message || error);
  }

  getUserRole(roles: any[]) {
    let role = '';

    roles.find(res => {
      if (res.organization === this.organizationId) {
        role = res.role;
      }
    });

    return role;
  }

  getUserTeam(roles: any[]) {
    let team = '';

    roles.find(res => {
      if (res.organization === this.organizationId && res.teams.length) {
        team = res.teams[0].name;
      }
    });

    return team;
  }

  toggleFilters(): void {
    this.isFiltersOpen = !this.isFiltersOpen;
  }

  onFilterChange(filter: { name: string, value: string }): void {
    const isActive = !!this.activeFilters.find(element => element.name === filter.name);
    const isEmptyFilter = !filter.value;
    const isToDeleteFilter = isActive && isEmptyFilter;
    const isToChangeFilter = isActive && !isEmptyFilter;

    if (isToDeleteFilter) {
      this.deleteFilter(filter);
    } else if (isToChangeFilter) {
      this.changeFilter(filter);
    } else {
      this.addFilter(filter);
    }

    this.filterMembers();
  }

  private deleteFilter(filter: { name: string, value: string }): void {
    this.activeFilters = this.activeFilters.filter(activeFilter => activeFilter.name !== filter.name);
  }

  private addFilter(filter: { name: string, value: string }): void {
    this.activeFilters.push(filter);
  }

  private changeFilter(filter: { name: string, value: string }): void {
    this.activeFilters.forEach(activeFilter => {
      if (activeFilter.name === filter.name) {
        activeFilter.value = filter.value;
      }
    });
  }

  private filterMembers(): void {
    this.filteredMembers = this.membersList;

    if (this.activeFilters.length > 0) {
      this.activeFilters.forEach(filter => {
        const filterName = filter.name;
        const filterValue = filter.value;

        switch (filterName) {
          case 'team':
            this.filteredMembers = this.getFilteredByTeamMembers(filterValue);
            break;
          case 'organizationRole':
            this.filteredMembers = this.getFilteredByRoleMembers(filterValue);
            break;
          case 'status':
            this.filteredMembers = this.getFilteredByStatusMembers(filterValue);
            break;
          default:
            this.filteredMembers = this.membersList;
        }
      });
    }
  }

  private getFilteredByTeamMembers(filterValue: string): User[] {
    return this.filteredMembers.filter(member => {
      const isActive = !member.invite;
      let userTeam = '';

      if (isActive) {
        userTeam = member.roles.length ? this.getUserTeam(member.roles) : 'No team';
      } else {
        userTeam = member.invite.teams.length ? member.invite.teams[0].name : 'No team';
      }

      return userTeam === filterValue;
    });
  }

  private getFilteredByRoleMembers(filterValue: string): User[] {
    return this.filteredMembers.filter(member => {
      const isActive = !member.invite;
      let userRole = '';

      if (isActive) {
        userRole = member.roles.length ? this.getUserRole(member.roles) : 'No role';
      } else {
        userRole = member.invite.role || 'No role';
      }

      return userRole === filterValue;
    });
  }

  private getFilteredByStatusMembers(filterValue: string): User[] {
    return this.filteredMembers.filter(member => {
      if (filterValue === 'Invited') {
        return !!member.invite;
      } else {
        return !member.invite;
      }
    });
  }

  sortMembers(row: string) {
    switch (row) {
      case 'name':
        this.sortForward ?
          this.filteredMembers.sort((a, b) => a.profile.firstName.localeCompare(b.profile.firstName)) :
          this.filteredMembers.sort((a, b) => b.profile.firstName.localeCompare(a.profile.firstName))
        break;
      case 'role':
        this.sortForward ?
          this.filteredMembers.sort((a, b) => (
            a.role[0] === b.role[0] ? (a.role[1] > b.role[1] ? -1 : 1):(a.role < b.role ? -1 : 1))
          ):
          this.filteredMembers.sort((a, b) => (
            a.role[0] === b.role[0] ? (a.role[1] > b.role[1] ? 1 : -1):(a.role < b.role ? 1 : -1))
          )
        break;
      case 'status':
        this.sortForward ?
          this.filteredMembers.sort((a, b) => a.status.localeCompare(b.status)) :
          this.filteredMembers.sort((a, b) => b.status.localeCompare(a.status))
        break;
      default:
        return;
    }

    this.sortForward = !this.sortForward;
  }

  showTooltipIfLong(toolTip: any, memberTeam: HTMLElement): void {
    const memberTeamWidth = memberTeam.offsetWidth;
    const memberContainerTeamWidth = memberTeam.parentElement.clientWidth;

    if (memberTeamWidth >= memberContainerTeamWidth) {
      toolTip.show();
    }
  }

  private findMembersByQueries(textSearchItems: Array<string>): void {
    textSearchItems.forEach((searchItem, index) => {
      const isFirstQuery = index === 0;
      let itemsToFilter = isFirstQuery ? this.membersList : this.filteredMembers;

      if (itemsToFilter.length) {
        this.filteredMembers = itemsToFilter.filter(m => {
          if (!m.profile) return false;
          const hasMatchInFirstName = this.findMatchesInField(m.profile.firstName.toLowerCase(), searchItem);
          const hasMatchInLastName = this.findMatchesInField(m.profile.lastName.toLowerCase(), searchItem);
          const hasMatchInEmail = this.findMatchesInField(m.email.toLowerCase(), searchItem);

          if (hasMatchInFirstName || hasMatchInLastName || hasMatchInEmail) {
            return m;
          }
        });
      }
    });
  }

  private findMatchesInField(fieldValue: string, searchItem: string): boolean {
    return fieldValue.includes(searchItem);
  }

  private handleMousewheel(event): void {
    const isOnMembersList = event.path.some(element => {
      return element.classList?.contains('members__item') ||
        element.classList?.contains('members__list') ||
        element.classList?.contains('container');
    });

    const isOnServiceList = event.path.some(element => {
      return element.classList?.contains('member-form__container') ||
        element.classList?.contains('member-form');
    });

    const isOrganizationMembersListScrollable =
      this.organizationMembersList.nativeElement.scrollHeight > this.organizationMembersList.nativeElement.offsetHeight;

    const isInsideModal = isOnMembersList || isOnServiceList;

    if (!isInsideModal && isOrganizationMembersListScrollable && !this.isModalOpened) {
      this.scrollMembersList(event.deltaY);
    }
  }

  private scrollMembersList(scrollTop: number): void {
    const currentScrollPosition = this.organizationMembersList.nativeElement.scrollTop;

    this.organizationMembersList.nativeElement.scrollTo({
      top: currentScrollPosition + scrollTop,
      left: 0
    });
  }

  private addModalWatchers(): void {
    this.modalService.onShow.subscribe(() => {
      this.isModalOpened = true;
    });

    this.modalService.onHide.subscribe((reason: string) => {
      this.isModalOpened = false;
    });
  }
}
