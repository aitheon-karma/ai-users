import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationCompanyRegistrationComponent } from './organization-company-registration.component';

describe('OrganizationCompanyRegistrationComponent', () => {
  let component: OrganizationCompanyRegistrationComponent;
  let fixture: ComponentFixture<OrganizationCompanyRegistrationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrganizationCompanyRegistrationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrganizationCompanyRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
