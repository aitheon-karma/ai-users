import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AirdropTokensComponent } from './airdrop-tokens.component';

describe('AirdropTokensComponent', () => {
  let component: AirdropTokensComponent;
  let fixture: ComponentFixture<AirdropTokensComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AirdropTokensComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AirdropTokensComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
