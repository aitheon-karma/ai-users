import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetFeedComponent } from './widget-feed.component';

describe('WidgetFeedComponent', () => {
  let component: WidgetFeedComponent;
  let fixture: ComponentFixture<WidgetFeedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetFeedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetFeedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
