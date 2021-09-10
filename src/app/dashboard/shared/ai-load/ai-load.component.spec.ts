import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AiLoadComponent } from './ai-load.component';

describe('AiLoadComponent', () => {
  let component: AiLoadComponent;
  let fixture: ComponentFixture<AiLoadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AiLoadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AiLoadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
