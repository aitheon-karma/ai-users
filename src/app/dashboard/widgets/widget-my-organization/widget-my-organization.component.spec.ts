import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetMyOrganizationComponent } from './widget-my-organization.component';

describe('WidgetMyOrganizationComponent', () => {
  let component: WidgetMyOrganizationComponent;
  let fixture: ComponentFixture<WidgetMyOrganizationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetMyOrganizationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetMyOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
