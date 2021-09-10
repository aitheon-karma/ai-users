import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationLocationsCardComponent } from './organization-locations-card.component';

describe('OrganizationLocationsCardComponent', () => {
  let component: OrganizationLocationsCardComponent;
  let fixture: ComponentFixture<OrganizationLocationsCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrganizationLocationsCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrganizationLocationsCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
