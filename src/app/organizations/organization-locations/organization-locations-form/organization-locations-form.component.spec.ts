import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationLocationsFormComponent } from './organization-locations-form.component';

describe('OrganizationLocationsFormComponent', () => {
  let component: OrganizationLocationsFormComponent;
  let fixture: ComponentFixture<OrganizationLocationsFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrganizationLocationsFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrganizationLocationsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
