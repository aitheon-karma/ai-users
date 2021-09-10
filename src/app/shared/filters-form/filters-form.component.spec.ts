import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FiltersFormComponent } from './filters.component';

describe('FiltersComponent', () => {
  let component: FiltersFormComponent;
  let fixture: ComponentFixture<FiltersFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FiltersFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FiltersFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
