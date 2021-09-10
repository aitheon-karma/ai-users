import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WidgetMarketComponent } from './widget-market.component';

describe('WidgetMarketComponent', () => {
  let component: WidgetMarketComponent;
  let fixture: ComponentFixture<WidgetMarketComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WidgetMarketComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WidgetMarketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
