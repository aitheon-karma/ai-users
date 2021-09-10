import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminServicesFormComponent } from './admin-services-form.component';

describe('AdminServicesFormComponent', () => {
  let component: AdminServicesFormComponent;
  let fixture: ComponentFixture<AdminServicesFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminServicesFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminServicesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
