import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminUserTypesFormComponent } from './admin-user-types-form.component';

describe('AdminUserTypesFormComponent', () => {
  let component: AdminUserTypesFormComponent;
  let fixture: ComponentFixture<AdminUserTypesFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminUserTypesFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminUserTypesFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
