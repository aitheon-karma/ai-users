import { Component, OnInit, Input, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AuthService, DriveDocumentsService, RestService, Document } from '@aitheon/core-client';
import { ToastrService } from 'ngx-toastr';
import { environment } from '../../../environments/environment';
import { first } from 'rxjs/operators';

const DRIVE_API = `${environment.baseApi}/drive/api`;
@Component({
  selector: 'ai-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: FileUploadComponent,
    multi: true
  }]
})
export class FileUploadComponent implements OnInit, ControlValueAccessor {
  @ViewChild('driveUploader') driveUploader: any;
  @Input() multiple = false;
  @Input() isPublic = false;
  @Input() onlySignedUrl = true;
  @Input() accept = 'image/*';

  serviceId = 'USERS';
  userId: string;
  organizationId: string;
  mongoIdLength = 24;

  private onChange;
  loading = false;
  docs: any[] = [];

  currentServiceKey: {
    _id: string,
    key: string
  };

  constructor(
    private toastr: ToastrService,
    private restService: RestService,
    private authService: AuthService,
    private driveDocumentsService: DriveDocumentsService,
  ) { }

  async ngOnInit() {
    const user = await this.authService.currentUser.pipe(first()).toPromise();
    this.userId = user && user._id;

    const org = await this.authService.activeOrganization.pipe(first()).toPromise();
    this.organizationId = org && org._id;
  }

  onFailedUpload(event: any) {
    this.toastr.error('Attachment upload failed.');
  }

  onBeforeUpload(event) {
    this.loading = true;
    this.currentServiceKey = {
      _id: this.serviceId,
      key:  this.userId
    };

    this.restService.post(`${DRIVE_API}/acl`, {
      level: 'FULL',
      user: this.userId,
      service: this.currentServiceKey,
      public: true
    }, true).subscribe((res) => {
      this.loading = false;
      this.driveUploader.uploadAll();
    }, (err: any) => {
      this.loading = false;
      this.toastr.error('Could not upload files');
      this.driveUploader.uploader.queue = [];
    });
  }

  async removeDocumentFromDrive(doc: any = '') {
    const url = doc.signedUrl || doc;
    const search = '/DRIVE/DOCUMENTS/';
    const start = url.indexOf(search);
    if (start === -1) {
      throw new Error('Wrong file url');
    }

    let documentId = url.slice(start + search.length, start + search.length + this.mongoIdLength);
    const result = await this.driveDocumentsService.remove(documentId).toPromise();
  }

  onSuccessUpload(file: any) {
    let emit: any;
    if (this.multiple) {
      this.docs.push(file);
      emit = this.docs;
    } else {
      if (this.docs.length) {
        this.removeDocumentFromDrive(this.docs[0]);
      }
      this.docs = [file];
      emit = this.onlySignedUrl ? file.signedUrl : file;
    }

    if (this.onChange) {
      this.onChange(emit);
    }
  }

  removeDocument(doc) {
    const index = this.docs.findIndex((item: Document) => item === doc);
    this.docs.splice(index , 1);
    this.removeDocumentFromDrive(doc);
  }

  writeValue(value) {
    if (Array.isArray(value)) {
      this.docs = value;
    } else {
      this.docs = !!value ? [value] : [];
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {  }

  setDisabledState(isDisabled: boolean): void {  }
}
