import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { OrganizationsService } from 'app/organizations/shared';
import { switchMap, debounceTime, filter, map, first } from 'rxjs/operators';
import { Observable } from 'rxjs/Observable';
import { ToastrService } from 'ngx-toastr';
import { UsersService, User } from '../../../users/shared';

@Component({
  selector: 'fl-organization-member-pick-form',
  templateUrl: './organization-member-pick-form.component.html',
  styleUrls: ['./organization-member-pick-form.component.scss']
})
export class OrganizationMemberPickFormComponent implements OnInit, AfterViewInit, OnDestroy {

  searchValue: any;
  repeatSearchInterval: any;

  @Input() ignoreEmails: string[];
  @Input() organizationId: string;
  @Output() memberSelected = new EventEmitter<User>();
  @Output() canceled = new EventEmitter();

  @ViewChild('search') search: ElementRef;

  isNewUser = false;
  memberPickForm: FormGroup;
  organization: any;
  organizationName: string;
  searchResults: [{ _id: string, profile: { firstName: string, lastName: string }, roles: any[], email: string }];

  private emailMask = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,4}))$/;

  constructor(private fb: FormBuilder,
    private orgService: OrganizationsService,
    private userService: UsersService,
    private toaster: ToastrService) { }

  ngOnInit() {

    this.memberPickForm = this.fb.group({
      searchText: ['', Validators.required]
    });
    this.processSearch();

    this.orgService.getOrg(this.organizationId).subscribe(res => this.organizationName = res.name)
  }

  ngAfterViewInit() {
    this.search.nativeElement.focus();
  }

  async onSubmit() {
    const value = this.memberPickForm.value.searchText as string;
    if (this.memberPickForm.invalid) {
      this.toaster.error('Please enter an email or a search key');
    } else if (!this.isValidEmail(value)) {
      this.toaster.warning('Invalid email, Select from the list');
    } else if (this.ignoreEmails.includes(value.toLowerCase().trim())) {
      this.toaster.show('This member is already present in this organization or has been invited');
    } else if (this.searchResults.length === 1) {
      this.memberSelected.emit(this.searchResults[0] as User);
    } else {
      const userCheckResult = await this.userService.isUserExists(value).toPromise();
      if (userCheckResult.exist && this.searchResults.length === 0) {
        if (!this.repeatSearchInterval) {
          this.repeatSearchInterval = setTimeout(() => {
            this.onSubmit();
            return;
          }, 1000);
        }
      } else {
        this.memberSelected.emit(userCheckResult.exist ? this.searchResults[0] as User : { email: value } as User);
      }
    }
  }

  selectMember(member?: any) {
    if (!member) {
      const email = this.memberPickForm.get('searchText').value;
      member = new User();
      member.email = email;
    } else if (!member._id) {
      const email = member.email;
      member = new User();
      member.email = email;
    } else {
      member['newInvite'] = true;
    }

    this.memberSelected.emit(member);
  }

  onSearchResults(res: any) {
    this.searchResults = res;
  }

  processSearch() {
    this.memberPickForm.controls['searchText'].valueChanges
      .pipe(debounceTime(300), switchMap((searchText: string) => {
        this.isNewUser = false;
        if (!searchText || searchText.length < 2) {
          return Observable.of([]);
        }
        const search$ = this.orgService.searchUsers(this.organizationId, searchText)
          .pipe(map(res => res.filter(s => !this.ignoreEmails.includes(s.email))));

        return search$;
      }))
      .subscribe(res => this.onSearchResults(res), err => this.handleError(err));
  }

  private isValidEmail(email: string) {
    // tslint:disable-next-line: max-line-length
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  handleError(error: any) {
    this.toaster.error(error.message || error);
  }

  clearSerchInput(event: Event, search: any) {
    this.memberPickForm.get('searchText').setValue('');
  }

  ngOnDestroy() {
    if (this.repeatSearchInterval) {
      clearInterval(this.repeatSearchInterval);
    }
  }

  avatarName(firstName: string = '', lastName: string = '') {
    return `${firstName.replace(/\s/g, '')} ${lastName.replace(/\s/g, '')}`;
  }

  public isSearchTextValidEmail(): boolean {
    return this.emailMask.test(this.memberPickForm.get('searchText').value);
  }
}
