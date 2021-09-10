import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationLocationsComponent } from './organization-locations.component';

describe('OrganizationLocationsComponent', () => {
  let component: OrganizationLocationsComponent;
  let fixture: ComponentFixture<OrganizationLocationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrganizationLocationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrganizationLocationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
