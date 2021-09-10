import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OrganizationBotsComponent } from './organization-bots.component';

describe('OrganizationBotsComponent', () => {
  let component: OrganizationBotsComponent;
  let fixture: ComponentFixture<OrganizationBotsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OrganizationBotsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OrganizationBotsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
