import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesMapComponent } from './services-map.component';

describe('ServicesMapComponent', () => {
  let component: ServicesMapComponent;
  let fixture: ComponentFixture<ServicesMapComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServicesMapComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicesMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
