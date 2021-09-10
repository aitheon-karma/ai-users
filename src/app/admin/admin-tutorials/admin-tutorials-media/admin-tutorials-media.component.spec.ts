import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminTutorialsMediaComponent } from './admin-tutorials-media.component';

describe('AdminTutorialsMediaComponent', () => {
  let component: AdminTutorialsMediaComponent;
  let fixture: ComponentFixture<AdminTutorialsMediaComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdminTutorialsMediaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdminTutorialsMediaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
