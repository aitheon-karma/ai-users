import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetCommunitiesComponent } from './widget-communities.component';

describe('WidgetCommunitiesComponent', () => {
  let component: WidgetCommunitiesComponent;
  let fixture: ComponentFixture<WidgetCommunitiesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetCommunitiesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetCommunitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
