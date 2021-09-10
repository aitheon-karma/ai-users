import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { UserKYCDocumentsService } from '../shared/user-kyc-documents.service';
import { UserKYCDocument } from '../shared/user-kyc-document';
import { FormGroup, Validators, FormBuilder, FormControl, ValidatorFn, AbstractControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AiWebClientService } from '@aitheon/ai-web-client-angular';

@Component({
  selector: 'fl-kyc-documents',
  templateUrl: './kyc-documents.component.html',
  styleUrls: ['./kyc-documents.component.scss']
})
export class KycDocumentsComponent implements OnInit {

  @Output() success: EventEmitter<void> = new EventEmitter<void>();

  documents: UserKYCDocument[];
  photoHoldingID: UserKYCDocument;
  photoID: UserKYCDocument;
  loading: boolean;

  showPhotoIDUploader: boolean;
  showPhotoHoldingIDUploader: boolean;

  showIDForm: boolean;
  photoIDForm: FormGroup;
  photoIDNumber: string;
  verificationCode: number;

  constructor(
    private userKYCDocumentsService: UserKYCDocumentsService,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private webClientService: AiWebClientService
  ) { }

  get showCode() {
    if (!this.photoHoldingID) {
      return true;
    }
    if (this.photoHoldingID && this.photoHoldingID.status !== 'REJECTED') {
      return false;
    }
    return true;
  }

  ngOnInit() {
    this.loadDocuments();
    this.buildForm();
  }

  openWebClient() {
    this.webClientService.show();
  }

  buildForm() {
    this.photoIDForm = this.fb.group({
      photoIDNumber: ['', [Validators.required]]
    });
    this.verificationCode = Math.floor(100000 + Math.random() * 900000);
  }

  // private verificationMatch() {
  //   // return function check (c: FormControl) {
  //   //   return (c.value !== this.verificationCode) ? null : { 'verificationMatch': { valid: false }};
  //   // };
  //   return (control: AbstractControl): {[key: string]: any} | null => {
  //     // const forbidden = nameRe.test(control.value);
  //     const forbidden = false;
  //     return forbidden ? {'forbiddenName': {value: control.value}} : null;
  //   };
  // }

  loadDocuments() {
    this.loading = true;
    this.userKYCDocumentsService.list().subscribe((documents: UserKYCDocument[]) => {
      this.documents = documents;
      this.photoHoldingID = documents.find((d: UserKYCDocument) => d.docType === 'PHOTO_HOLDING_ID');
      this.photoID = documents.find((d: UserKYCDocument) => d.docType === 'PHOTO_ID');

      if (!this.photoID || this.photoID && !this.photoID.photoIDNumber) {
        this.showIDForm = true;
      }

      if (this.photoID && this.photoID.photoIDNumber) {
        this.showIDForm = false;
        this.photoIDNumber = 'true';
      }

      this.showPhotoHoldingIDUploader = !this.photoHoldingID;
      this.showPhotoIDUploader = !this.photoID || (this.photoID && !this.photoID.status);

      this.checkStatuses();
      this.loading = false;
    }, (err: any) => {
      this.toastr.error(err);
    });
  }

  onUploadSuccess(event: { docType: string }) {
    if (event.docType === 'PHOTO_ID') {
      if (!this.photoID) {
        this.photoID = {} as UserKYCDocument;
      }
      this.photoID.docType = 'PHOTO_ID';
      this.photoID.status = 'UPLOADED';
      this.showPhotoIDUploader = false;
    }
    if (event.docType === 'PHOTO_HOLDING_ID') {
      this.photoHoldingID = { docType: 'PHOTO_HOLDING_ID', status: 'UPLOADED' } as UserKYCDocument;
      this.showPhotoHoldingIDUploader = false;
    }
    this.checkStatuses();
  }

  checkStatuses() {
    if (this.photoHoldingID && this.photoHoldingID.status && this.photoID && this.photoID.status && this.photoID.photoIDNumber ) {
      this.success.emit();
    }
  }

  resend(value: string) {
    this[value] = !this[value];
  }

  onPhotoIDFormSubmit() {
    const photoIDNumber = this.photoIDForm.get('photoIDNumber').value;
    if (photoIDNumber.toString() === this.verificationCode.toString()) {
      this.photoIDForm.get('photoIDNumber').setErrors({ verificationMatch: true });
    } else {
      if (photoIDNumber) {
        this.photoIDForm.get('photoIDNumber').setErrors(null);
      }
    }
    if (this.photoIDForm.invalid) {
      return;
    }

    this.userKYCDocumentsService.savePhotoIDNumber(photoIDNumber).subscribe(() => {
      if (this.photoID) {
        this.photoID.photoIDNumber = 'true';
      } else {
        this.photoID = {
          photoIDNumber: 'true'
        } as UserKYCDocument;
      }
      this.photoIDNumber = 'true';
      this.showIDForm = false;
      this.buildForm();
      this.toastr.success('Saved');
      this.checkStatuses();
    }, (err: any) => {
      this.toastr.error(err);
    });
  }
}

// export function forbiddenNameValidator(nameRe: RegExp): ValidatorFn {
//   return (control: AbstractControl): {[key: string]: any} | null => {
//     const forbidden = nameRe.test(control.value);
//     return forbidden ? {'forbiddenName': {value: control.value}} : null;
//   };
// }
