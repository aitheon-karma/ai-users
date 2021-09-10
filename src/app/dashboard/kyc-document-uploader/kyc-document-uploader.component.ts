import { Component, OnInit, Input, EventEmitter, Output } from '@angular/core';
import { FileUploader, FileItem } from 'ng2-file-upload';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@aitheon/core-client';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'fl-kyc-document-uploader',
  templateUrl: './kyc-document-uploader.component.html',
  styleUrls: ['./kyc-document-uploader.component.scss']
})
export class KycDocumentUploaderComponent implements OnInit {

  @Input() docType: string;
  @Input() verificationCode: string;
  @Output() success: EventEmitter<{ docType: string }> = new EventEmitter<{ docType: string }>();

  baseUrl: string;
  uploader: FileUploader;
  hasBaseDropZoneOver = false;
  authToken: string;
  uploading: boolean;

  constructor(
    private toastr: ToastrService,
    private authService: AuthService) {
      this.authService.token.subscribe((token: string) => {
        this.authToken = token;
      });
  }

  ngOnInit() {
    const xBase = (document.getElementsByTagName('base')[0] || { href: '/' }).href;
    this.baseUrl = xBase;
    const url = `${ this.baseUrl }api/users/kyc/documents?docType=${ this.docType }`;
    this.initUploader(url);
    // /api/users/kyc/documents
  }

  initUploader(baseUrl: string): void {
    this.uploader = new FileUploader({
      url: baseUrl,
      method: 'POST',
      autoUpload: true,
      // allowedFileType: ['images']
    });

    /**
     * Events
     */
    this.uploader.onBeforeUploadItem = () => {
      this.uploading = true;
    };

    this.uploader.onAfterAddingAll = () => {
      
      // this.uploader.uploadAll();
    };

    this.uploader.onBuildItemForm = (fileItem: FileItem, form: any) => {
      form.append('docType', this.docType);
      form.append('verificationCode', this.verificationCode || '');
    };

    this.uploader.onSuccessItem = (fileItem: FileItem, response: any) => {
      this.uploading = false;
      this.success.emit({ docType: this.docType });
    };

    this.uploader.onErrorItem = (fileItem: FileItem, response: any, status: any) => {
      this.uploading = false;
      try {
        response = JSON.parse(response);
        response = response.message;
      } catch (err) { }
      fileItem.remove();
      this.toastr.error(`${ fileItem.file.name } ${ response } `, `Upload error (${ status }) `);
    };
  }

  fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

}
