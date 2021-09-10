import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersSecurityComponent } from './users-security.component';

describe('UsersSecurityComponent', () => {
  let component: UsersSecurityComponent;
  let fixture: ComponentFixture<UsersSecurityComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UsersSecurityComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UsersSecurityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
