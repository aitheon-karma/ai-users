import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUserTypesComponent } from './admin-user-types.component';

describe('AdminUserTypesComponent', () => {
  let component: AdminUserTypesComponent;
  let fixture: ComponentFixture<AdminUserTypesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminUserTypesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminUserTypesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
