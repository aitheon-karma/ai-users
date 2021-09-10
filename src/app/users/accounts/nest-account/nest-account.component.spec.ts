import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NestAccountComponent } from './nest-account.component';

describe('NestAccountComponent', () => {
  let component: NestAccountComponent;
  let fixture: ComponentFixture<NestAccountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NestAccountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NestAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
