import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminServicesDashboardComponent } from './admin-services-dashboard.component';

describe('AdminServicesDashboardComponent', () => {
  let component: AdminServicesDashboardComponent;
  let fixture: ComponentFixture<AdminServicesDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminServicesDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminServicesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
