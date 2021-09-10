import { Component, OnInit, ViewChild, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Organization, OrgDocument, OrganizationsService } from '../../../organizations/shared';
import { AuthService, DriveUploaderComponent } from '@aitheon/core-client';
import { environment } from 'environments/environment';
import {eventType} from "aws-sdk/clients/health";

@Component({
  selector: 'fl-organization-documents-form',
  templateUrl: './organization-documents-form.component.html',
  styleUrls: ['./organization-documents-form.component.scss']
})
export class OrganizationDocumentsFormComponent implements OnInit {
  constructor(private fb: FormBuilder,
    private authService: AuthService) { }
  documentForm: FormGroup;
  currentOrganization: Organization;
  currentServiceKey: any;
  document: OrgDocument;
  uploading = false;
  submitted = false;
  dropdownOpen: boolean;
  dropdownChoise = false;
  filledSelect: boolean;
  dropdownLabelUp = false;
  multiSelect = false;

  @Output() savedDoc = new EventEmitter<OrgDocument>();

  @ViewChild('driveUploader') driveUploader: DriveUploaderComponent;

  docTypes = ['Incorporate Certificate', 'Tax Reg. Certificate', 'Other'];
  currentSelectedType = '';
  typeConfig = {
    search: false,
    placeholder: 'Select type',
  };

  ngOnInit() {
    this.documentForm = this.fb.group({
      type: ['', [Validators.required]],
      file: ['', [Validators.required]]
    });
    this.authService.activeOrganization.subscribe((org: any) => {
      this.currentOrganization = org;
      this.currentServiceKey = {
        _id: 'USERS',
        key: `${this.currentOrganization._id}`
      };
    });
  }

  setType(e) {
    this.currentSelectedType = e.value;
    this.dropdownChoise = !!e.value;
    if (e.value === 'Other') {
      this.documentForm.get('type').setValue('');
      return;
    }
    this.documentForm.get('type').setValue(e.value);
  }


  onSuccessUpload(uploadData: any) {
    this.uploading = false;
    this.documentForm.get('file').setValue(uploadData);
  }

  onSubmit() {
    this.submitted = true;
    if (this.documentForm.invalid) {
      return;
    }
    const value = this.documentForm.value;
    this.document = new OrgDocument();
    this.document.docType = value.type;
    this.document.contentType = value.file.contentType;
    this.document.createdAt = value.file.createdAt;
    this.document.fileName = value.file.fileName;
    this.document.url = `${environment.baseApi}${environment.driveUrl}/api/documents/${value.file._id}`;
    this.document.size = + value.file.size;
    this.document.fileName = value.file.name;
    this.document.driveFile = value.file._id;
    this.savedDoc.emit(this.document);
  }

  get uploadedFileName() {
    return this.documentForm.get('file').value.name;
  }

  removeFile() {
    this.documentForm.get('file').setValue('');
  }

  parentClick() {
    this.dropdownOpen = !this.dropdownOpen;
  }

}
