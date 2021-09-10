import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetCreatorsStudioComponent } from './widget-creators-studio.component';

describe('WidgetCreatorsStudioComponent', () => {
  let component: WidgetCreatorsStudioComponent;
  let fixture: ComponentFixture<WidgetCreatorsStudioComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetCreatorsStudioComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetCreatorsStudioComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
