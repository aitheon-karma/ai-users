import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KycDocumentUploaderComponent } from './kyc-document-uploader.component';

describe('KycDocumentUploaderComponent', () => {
  let component: KycDocumentUploaderComponent;
  let fixture: ComponentFixture<KycDocumentUploaderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KycDocumentUploaderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KycDocumentUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
