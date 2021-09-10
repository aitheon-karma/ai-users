import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceModalComponent } from './service-modal.component';

describe('ServiceModalComponent', () => {
  let component: ServiceModalComponent;
  let fixture: ComponentFixture<ServiceModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
