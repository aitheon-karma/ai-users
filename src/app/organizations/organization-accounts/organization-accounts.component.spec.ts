import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationAccountsComponent } from './organization-accounts.component';

describe('OrganizationAccountsComponent', () => {
  let component: OrganizationAccountsComponent;
  let fixture: ComponentFixture<OrganizationAccountsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrganizationAccountsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrganizationAccountsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
