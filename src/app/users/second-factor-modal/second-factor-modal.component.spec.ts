import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SecondFactorModalComponent } from './second-factor-modal.component';

describe('SecondFactorModalComponent', () => {
  let component: SecondFactorModalComponent;
  let fixture: ComponentFixture<SecondFactorModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SecondFactorModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SecondFactorModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
