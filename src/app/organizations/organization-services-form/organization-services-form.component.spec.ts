import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationServicesFormComponent } from './organization-services-form.component';

describe('OrganizationServicesFormComponent', () => {
  let component: OrganizationServicesFormComponent;
  let fixture: ComponentFixture<OrganizationServicesFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrganizationServicesFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrganizationServicesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
