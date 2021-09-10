import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetProfileComponent } from './widget-profile.component';

describe('WidgetComponent', () => {
  let component: WidgetProfileComponent;
  let fixture: ComponentFixture<WidgetProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
