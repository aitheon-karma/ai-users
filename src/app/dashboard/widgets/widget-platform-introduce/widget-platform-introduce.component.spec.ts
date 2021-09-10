import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetPlatformIntroduceComponent } from './widget-platform-introduce.component';

describe('WidgetPlatformIntroduceComponent', () => {
  let component: WidgetPlatformIntroduceComponent;
  let fixture: ComponentFixture<WidgetPlatformIntroduceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetPlatformIntroduceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetPlatformIntroduceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
