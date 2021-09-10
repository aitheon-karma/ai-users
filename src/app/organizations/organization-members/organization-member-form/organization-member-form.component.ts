import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { User, UserRole } from '../../../users/shared';
import { Service, ServicesService, SERVICE_IGNORE_LIST } from '../../../services/shared';
import { UsersService } from '../../../users/shared/users.service';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { MembersSettingsHelperModel } from './shared/members-form.helper';
import { OrganizationsService } from '../../../organizations/shared';
import { Team, TeamsService } from '../../../teams/shared';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@aitheon/core-client';
import { forkJoin } from 'rxjs';
import { UniversalValidators } from "ng2-validators";
import { ORGANIZATION_ROLES } from '../../shared/enums/organization-roles.enum';

@Component({
  selector: 'fl-organization-member-form',
  templateUrl: './organization-member-form.component.html',
  styleUrls: ['./organization-member-form.component.scss']
})
export class OrganizationMemberFormComponent implements OnInit {
  @Input() member: User;
  @Input() organizationId: string;

  @Output() canceled = new EventEmitter();
  @Output() saved = new EventEmitter();

  memberSettingsHelper: MembersSettingsHelperModel[] = [];
  membersForm: FormGroup;
  memberRole: string;
  teams: Team[];
  orgRole: UserRole;
  memberOrg: UserRole;
  allServices: Service[];
  platformInvite = false;
  memberInvite = false;
  submitted = false;
  userExist = false;
  currentUser: any;
  currentUserOrg: UserRole;
  isFormEditable: boolean = false;
  nameMask = /^[a-zA-Z]+(?:['\s-][a-zA-Z]+)*$/;
  rolesSelectOptions = [
    {
      name: 'Owner',
      tooltip: 'Able to manage user, organization and service settings, assign roles and delete an organization. Only available to Owners',
      disabled: false
    },
    {
      name: 'SuperAdmin',
      tooltip: 'Able to assign SuperAdmin or OrgAdmin role to a user and manage settings for an organization and services. Only available to SuperAdmins',
      disabled: false
    },
    {
      name: 'OrgAdmin',
      tooltip: 'Able to manage settings for services'
    },
    {
      name: 'User',
      tooltip: 'Able to manage personal settings'
    }];
  orgServices: Service[];
  rolesSelectConfig = {
    displayKey: 'role',
    search: false,
  };
  TeamsSelectConfig = {
    displayKey: 'name',
    search: false,
  };
  availableServiceRoles = ['User', 'ServiceAdmin'];
  currentOrganization: any;
  validationState: any = {
    firstName: {
      isValid: true,
      message: ''
    },
    lastName: {
      isValid: true,
      message: ''
    }
  };

  private fieldsToValidate: string[] = ['firstName', 'lastName'];

  get displayName() {
    const value = `${this.membersForm.value.firstName || ''} ${this.membersForm.value.lastName || ''}`;
    return value.trim().length ? value : 'New Member';
  }

  get membersServicesFormArray() {
    return this.membersForm.get('memberServices') as FormArray;
  }

  constructor(private serviceService: ServicesService,
              private usersService: UsersService,
              private fb: FormBuilder,
              private orgService: OrganizationsService,
              private toastr: ToastrService,
              private teamService: TeamsService,
              private authService: AuthService) {
  }

  ngOnInit() {
    this.authService.activeOrganization.subscribe(res => {
      this.currentOrganization = res;
    });

    this.authService.currentUser.subscribe((user: any) => {
      this.currentUser = user;
    });

    if (this.member && this.member._id) {
      this.memberInvite = this.member['newInvite'] === true;
    } else {
      this.platformInvite = true;
    }
    this.initForm();
    this.checkCurrentUserRole(this.currentUser);
  }

  checkCurrentUserRole(user: any) {
    this.currentUserOrg = user.roles ? user.roles.find(r => {
      return r.organization._id == this.organizationId
    }) : null;

    this.currentUserOrg.role !== 'Owner' ? this.rolesSelectOptions[0].disabled = true : '';
    this.currentUserOrg.role == 'OrgAdmin' ? this.rolesSelectOptions[1].disabled = true : '';
  }

  initForm() {
    const orgServices$ = this.serviceService.listByOrganization(this.organizationId);
    forkJoin([orgServices$, this.serviceService.list(), this.teamService.list(this.organizationId)]).subscribe(results => {
      this.teams = results[2];
      this.buildHelperModel(results[0], results[1]);
    }, err => this.handleError(err));
  }

  handleError(error: any) {
    this.toastr.error('Something went wrong');
  }

  buildHelperModel(orgServices: string[], allServices: Service[]) {
    const servicesToView = allServices.filter(s => (orgServices.includes(s._id) || (s.core && !SERVICE_IGNORE_LIST.includes(s._id))));
    this.orgRole = this.member.roles ? this.member.roles.find(r => r.organization === this.organizationId) : null;
    const roleServices = this.orgRole ? this.orgRole.services : [];
    this.memberRole = this.orgRole ? (this.orgRole.role || this.availableServiceRoles[0]) : this.availableServiceRoles[0];
    servicesToView.forEach(s => {
      const memberSettings = new MembersSettingsHelperModel();
      memberSettings.service = s;
      const role = roleServices.find(rs => rs.service === s._id);
      if (role) {
        memberSettings.enabled = true;
        memberSettings.serviceRole = role.role;
      }
      this.memberSettingsHelper.push(memberSettings);
    });
    this.buildForm();
  }

  buildForm() {
    const selectedTeams = (this.orgRole && this.orgRole.services) ? this.teams.filter(t => this.orgRole.teams.includes(t._id)) : [];

    const memberGroups = this.memberSettingsHelper.map(ms => {
      const teamService = ([].concat.apply([], selectedTeams.map(t => t.services))).find((s: any) => s.service === ms.service._id) as { service: string, role: string };
      let serviceRole: string;
      if (teamService) {
        ms.enabledByTeam = true;
        serviceRole = teamService.role;
      } else {
        serviceRole = ms.serviceRole || (ms.service.core ?
          (this.memberRole === 'User' ? 'User' : 'ServiceAdmin') : undefined);
      }
      const group = this.fb.group({
        core: [ms.service.core],
        role: new FormControl({ value: serviceRole, disabled: ms.enabledByTeam }),
        enabled: [ms.enabled || ms.service.core],
        name: [ms.service.name],
        serviceId: [ms.service._id],
        description: [ms.service.description],
        enabledByTeam: [ms.enabledByTeam]
      });

      group.get('enabled').valueChanges.subscribe(enabled => this.serviceCheckBoxChanged(enabled, ms.service.core, group));

      return group;
    });

    const basicMemberInfo: any = {};
    basicMemberInfo.email = this.member.email;
    if (this.member._id) {
      basicMemberInfo.firstName = this.member.profile.firstName;
      basicMemberInfo.lastName = this.member.profile.lastName;
      basicMemberInfo.profileUrl = this.member.profile.avatarUrl;
    }
    this.membersForm = this.fb.group({
      memberServices: this.fb.array(memberGroups),
      firstName: [
        basicMemberInfo.firstName,
        Validators.compose([
          Validators.required,
          UniversalValidators.minLength(2),
          UniversalValidators.maxLength(50),
          Validators.pattern(this.nameMask)
        ])
      ],
      lastName: [
        basicMemberInfo.lastName,
        Validators.compose([
          Validators.required,
          UniversalValidators.minLength(2),
          UniversalValidators.maxLength(50),
          Validators.pattern(this.nameMask)
        ])
      ],
      email: [basicMemberInfo.email, Validators.required],
      profileUrl: [basicMemberInfo.profileUrl],
      role: [this.memberRole, Validators.required],
      teams: [(this.orgRole?.teams[0] as any)?._id || selectedTeams[0]]
    });
    this.membersForm.get('role').valueChanges.subscribe(role => this.orgRoleChanged(role));
    this.membersForm.get('teams').valueChanges.subscribe(teamId => this.teamChanged(teamId));

    if (this.currentUserOrg?.role && this.orgRole?.role && this.currentUserOrg?.role !== 'Owner' &&
      this.currentUserOrg?.role !== 'SuperAdmin' &&
      this.orgRole?.role !== 'User' &&
      this.orgRole?.role !== 'OrgAdmin') {
      this.membersForm.get('role').disable();
      this.membersForm.get('teams').disable();
    } else if (this.currentUserOrg?.role && this.orgRole?.role && this.currentUserOrg?.role == 'SuperAdmin' && this.orgRole?.role == 'Owner') {
      this.membersForm.get('role').disable();
      this.membersForm.get('teams').disable();
    }

    this.disableFormIfNoPermissions();
    this.setFormListeners();
  }

  private teamChanged(teamId: string) {
    const isTeamSelected = (teamId && teamId.length > 0);
    let selectedTeam = this.teams.find(team => team._id === teamId);
    let services = selectedTeam?.services.slice();

    this.membersServicesFormArray.controls.filter(control => (!control.get('core').value)).forEach(control => {
      const serviceAdminService = isTeamSelected
        ? services.find(service => (service?.service === control.value.serviceId) && (service.role === 'ServiceAdmin'))
        : null;

      const foundService = isTeamSelected ? services.find(service => service?.service === control.value.serviceId) : null;

      if (foundService) {
        control.get('role').setValue(serviceAdminService ? serviceAdminService.role : foundService.role);
        control.get('enabled').setValue(true);
      } else {
        const orgService = this.orgRole ? this.orgRole.services.find(s => s.service === control.get('serviceId').value) : null;
        control.get('enabledByTeam').setValue(false);
        control.get('role').setValue(orgService ? orgService.role : this.memberRole === 'User' ? 'User' : 'ServiceAdmin');
        control.get('role').enable();
        control.get('enabled').setValue(orgService ? true : false);
      }
    });
  }

  private orgRoleChanged(role: string) {
    (this.membersForm.get('memberServices') as FormArray).controls.forEach(control => {
      if (control.get('core').value) {
        const coreRole = role === 'User' ? 'User' : 'ServiceAdmin';
        control.get('role').setValue(coreRole);
      }
    });
  }

  private serviceCheckBoxChanged(enabled: boolean, core: boolean, group: FormGroup) {
    const roleValue = enabled ? (core ? this.availableServiceRoles[1] :
      (this.membersForm.value.role === 'User' ? this.availableServiceRoles[0] : this.availableServiceRoles[1])) : undefined;
    if (!group.get('enabledByTeam').value) {
      group.get('role').setValue(roleValue);
    }
  }

  onSubmit() {
    this.submitted = true;

    this.validateForm();

    if (this.membersForm.invalid) {
      return;
    }

    let value = Object.assign({}, this.membersForm.value);
    value.teams = value.teams ? [value.teams] : [];
    const postData = this.buildBasicData(value);

    if (!this.memberInvite && !this.platformInvite) {
      this.orgService.updateUser(postData, this.organizationId, this.member._id)
        .subscribe(updateData => {
          this.toastr.success('Member successfully updated');
          this.saved.emit();
        });
    } else if (this.memberInvite) {
      const platFormInviteData: any = {
        organizationRole: postData,
        _id: this.member._id
      };
      this.orgService.sendInvite(this.organizationId, platFormInviteData)
        .subscribe(inviteResult => {
          this.toastr.success('User invited.');
          this.saved.emit();
        });
    } else if (this.platformInvite) {
      const platFormInviteData: any = {
        organizationRole: postData,
        email: value.email,
        profile: {
          firstName: value.firstName,
          lastName: value.lastName,
        }
      };
      this.orgService.sendInvite(this.organizationId, platFormInviteData)
        .subscribe(inviteResult => {
          this.toastr.success('User invited.');
          this.saved.emit();
        });
    }
  }

  private buildBasicData(submittedData: { memberServices: [{ core: boolean, description: string, enabled: boolean, name: string, role: string, serviceId: string, toRemove: boolean }], role: string, teams: Team[] }) {

    const teamServices = Array.from(new Set(([].concat.apply([],
      (submittedData.teams.map(t => t?.services))) as [{ service: string, role: string }]).map(s => s?.service)));
    const dataFilters = submittedData.memberServices.map(service => {
      service.toRemove = false;
      if (service.core) {
        if ((submittedData.role === 'User' && service.role === 'User') || submittedData.role !== 'User') {
          service.toRemove = true;
        }
      } else {
        service.toRemove = !service.enabled;
        teamServices.includes(service.serviceId) ? service.toRemove = true : null;
      }
      return service;
    }).filter(s => !s.toRemove);
    const postModel = {
      role: submittedData.role,
      teams: [],
      services: []
    };
    dataFilters.forEach(data => postModel.services.push({ service: data.serviceId, role: data.role }));
    postModel.teams = submittedData.teams;
    return postModel;
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

  private validateForm(): void {
    this.fieldsToValidate.forEach((controlName: string) => this.validateControl(controlName));
  }

  private validateControl(controlName: string): void {
    this.validationState[controlName].isValid = this.membersForm.get(controlName).valid;
    this.validationState[controlName].message = this.membersForm.get(controlName).valid
      ? ''
      : this.getErrorMessage(controlName);
  }

  private getErrorMessage(fieldName: string): string {
    const nameType = fieldName === 'firstName' ? 'First' : 'Last';
    const isRequired = this.membersForm.get(fieldName).hasError('required');
    const isMinLengthError = this.membersForm.get(fieldName).hasError('minLength');
    const isMaxLengthError = this.membersForm.get(fieldName).hasError('maxLength');
    const isPatternError = this.membersForm.get(fieldName).hasError('pattern');
    let errorMessage = '';

    if (isRequired) {
      errorMessage = `${nameType} name is required`;
    } else if (isMinLengthError) {
      errorMessage = `Minimum 2 characters`;
    } else if (isMaxLengthError) {
      errorMessage = `Maximum 50 characters`;
    } else if (isPatternError) {
      errorMessage = `${nameType} name is invalid`;
    }

    return errorMessage;
  }

  private setFormListeners() {
    this.fieldsToValidate.forEach((fieldName: string) => {
      this.setControlValueChangeListener(fieldName);
    });
  }

  private setControlValueChangeListener(controlName: string): void {
    this.membersForm.get(controlName).valueChanges
      .subscribe(value => {
        this.resetErrorState(controlName);
      });
  }

  private resetErrorState(fieldname: string): void {
    this.validationState[fieldname].isValid = true;
    this.validationState[fieldname].message = '';
    this.submitted = false;
  }

  private disableFormIfNoPermissions(): void {
    const userRoleValue = ORGANIZATION_ROLES[this.currentUserOrg.role.toUpperCase()];
    const memberRoleValue = ORGANIZATION_ROLES[this.memberRole.toUpperCase()];

    this.isFormEditable = userRoleValue >= memberRoleValue;
  }

}
