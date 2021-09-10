import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUserTypesListComponent } from './admin-user-types-list.component';

describe('AdminUserTypesListComponent', () => {
  let component: AdminUserTypesListComponent;
  let fixture: ComponentFixture<AdminUserTypesListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminUserTypesListComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminUserTypesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
