import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetOrganizationComponent } from './widget-organization.component';

describe('WidgetOrganizationComponent', () => {
  let component: WidgetOrganizationComponent;
  let fixture: ComponentFixture<WidgetOrganizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetOrganizationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
