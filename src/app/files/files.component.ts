import { File, FilesService } from './shared';
import { FormBuilder } from '@angular/forms';
import { AuthService } from '@aitheon/core-client';
import { ToastrService } from 'ngx-toastr';
import { FileItem, FileUploader } from 'ng2-file-upload';
import { Component, OnInit, Input, NgZone, ViewChild } from '@angular/core';
import { environment } from '../../environments/environment';
import { ModalDirective } from 'ngx-bootstrap/modal';

@Component({
  selector: 'fl-files',
  templateUrl: './files.component.html',
  styleUrls: ['./files.component.scss']
})
export class FilesComponent implements OnInit {

  @Input() files: File[];
  @Input() organizationId: string;
  @ViewChild('fileDetailModal') public fileDetailModal: ModalDirective;

  baseUrl: string;
  uploader: FileUploader;
  hasBaseDropZoneOver = false;

  authToken: string;
  editMode = false;
  selectedFile: File;
  previewFormat: string;
  previewUrl: string;

  constructor(
    private authService: AuthService,
    private toastr: ToastrService,
    private filesService: FilesService,
    private zone: NgZone,
    private fb: FormBuilder,
  ) {
     this.authService.token.subscribe((token: string) => {
      this.authToken = token;
    });

  }

  ngOnInit() {
    const xBase = (document.getElementsByTagName('base')[0] || { href: '/' }).href;
    this.baseUrl = environment.baseApi + xBase;
    const url = `${ this.baseUrl}/api/organizations/${ this.organizationId }/files`;

    this.initUploader(url);
  }

  toggleEditMode() {
    this.editMode = !this.editMode;
  }

  initUploader(baseUrl: string): void {
    this.uploader = new FileUploader({
      url: baseUrl,
      method: 'POST',
      authToken: 'JWT ' + this.authToken,
      autoUpload: true,
      // removeAfterUpload: true,
    });

    /**
     * Events
     */
    this.uploader.onSuccessItem = (fileItem: FileItem, response: any) => {
      let file = this.files.find((c: File) => c.fileItem && c.fileItem.index === fileItem.index);
      fileItem.remove();

      setTimeout(() => {
        file.uploading = false;
      }, 500);
      file.fileItem = undefined;
      file.uploadingFinished = true;
      file = Object.assign(file, JSON.parse(response));
    };

    this.uploader.onAfterAddingFile = (fileItem: FileItem) => {
      const file = new File();

      file.name = fileItem.file.name;
      file.size = fileItem.file.size;
      file.contentType = fileItem.file.type;
      file.fileBlob = fileItem._file;
      file.fileItem = fileItem;

      file.uploading = true;
      file.uploadingProgress = 0;

      this.files.push(file);
    };

    this.uploader.onBuildItemForm = (fileItem: FileItem, form: any) => {
      const content = this.files.find((c: File) => c.fileItem && c.fileItem.index === fileItem.index);
      if (content) {
        form.append('name', content.name);
      }
    };
    this.uploader.onErrorItem = (fileItem: FileItem, response: any, status: any) => {
      try {
        response = JSON.parse(response);
        response = response.message;
      } catch (err) { }
      const fileIndex = this.files.findIndex((c: File) => c.fileItem && c.fileItem.index === fileItem.index);
      if (fileIndex > -1) {
        this.files.splice(fileIndex, 1);
      }
      fileItem.remove();
      this.toastr.error(`${ fileItem.file.name } ${ response } `, `Upload error (${ status }) `);
    };
    this.uploader.onProgressItem = (fileItem: FileItem, progress: any) => {
      this.onProgressItem(fileItem, progress);
    };
  }

  onProgressItem(fileItem: FileItem, progress: any): void {
    const file = this.files.find((c: File) => c.fileItem && c.fileItem.index === fileItem.index);
    if (file) {
      this.zone.run(() => {
        file.uploadingProgress = progress;

      });
    }
  }

  fileOverBase(e: any): void {
    this.hasBaseDropZoneOver = e;
  }

  delete(file: File): void {
    this.filesService.remove(this.organizationId, file._id).subscribe(() => {
      const index = this.files.findIndex((t: File) => t._id === file._id);
      this.files.splice(index, 1);
      this.toastr.success('File deleted');
    });
  }

  showFileDetails(file: File): void {
    this.selectedFile = file;
    this.previewFormat = 'noSupport';
    if (this.selectedFile.contentType.includes('image')) {
      this.previewFormat = 'image';
    } else if (this.selectedFile.contentType.includes('text/plain') || this.selectedFile.contentType.includes('application/pdf')) {
      this.previewFormat = 'txtPDF';
    }

    // tslint:disable-next-line:max-line-length
    this.previewUrl = `${ this.baseUrl}/organizations/${ this.organizationId }/files/${ this.selectedFile._id}?fl_token=${ this.authToken }`;
    this.fileDetailModal.show();
  }

  hideFileDetails() {
    this.fileDetailModal.hide();
  }

  onHiddenFileDetails() {
    this.selectedFile = null;
    this.previewFormat = null;
    this.previewUrl = null;
  }
}
