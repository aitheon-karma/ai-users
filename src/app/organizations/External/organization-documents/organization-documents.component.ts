import { Component, OnInit, TemplateRef, Input, Output, EventEmitter } from '@angular/core';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { OrgDocument, OrganizationsService, Organization } from 'app/organizations/shared';
import { ToastrService } from 'ngx-toastr';
import { environment } from 'environments/environment';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'fl-organization-documents-one',
  templateUrl: './organization-documents.component.html',
  styleUrls: ['./organization-documents.component.scss']
})
export class OrganizationDocumentsComponentExternal implements OnInit {
  downloadLink: string;

  constructor(private modalService: BsModalService,
    private toastrService: ToastrService,
    private organizationService: OrganizationsService,
    private activeRoute: ActivatedRoute) { }

  searchText: string;
  modalRef: BsModalRef;
  loading = false;
  docDeleted = false;
  deletingDocs: string[] = [];
  submitted = false;
  baseUrl = environment.baseApi;
  organization: Organization;

  @Input() orgId: any;
  @Output() onFinish: EventEmitter<any> = new EventEmitter<any>();

  addDocument() {
  }

  ngOnInit() {
    this.organizationService.getOrg(this.orgId).subscribe(res => {
      this.organization = res;
    });
  }

  openModal(template: TemplateRef<any>) {
    this.modalRef = this.modalService.show(template, { ignoreBackdropClick: true });
  }

  onDocumentAdded(document: OrgDocument) {
    this.loading = true;
    this.organizationService.addDocument(this.organization._id, document)
      .subscribe((org: Organization) => {
        this.organization.documents = org.documents;
        this.toastrService.success('Document Added');
        this.loading = false;
      }, err => { this.toastrService.error(err.message); this.loading = false; });
    this.modalRef.hide();
  }

  removeDocument(docId: string) {
    this.deletingDocs.push(docId);
    this.organizationService.removeDocument(this.organization._id, docId).subscribe((org: Organization) => {
      this.organization.documents.splice(this.organization.documents.findIndex(d => d._id === docId), 1);
      this.toastrService.success('Document deleted');
      this.deletingDocs.splice(this.deletingDocs.findIndex(id => id === docId), 1);
      this.loading = false;
    }, err => {
      this.toastrService.error(err.message);
      this.deletingDocs.splice(this.deletingDocs.findIndex(id => id === docId), 1);
      this.loading = false;
    });
  }

  isDeleting(docId: string) {
    return this.deletingDocs.includes(docId);
  }

  downloadDocument(doc: OrgDocument) {

    const downloadUrl = `${environment.baseApi}${environment.driveUrl}/api/documents/${doc.driveFile}`;
    window.open(downloadUrl);
  }

  done() {
    this.organizationService.getOrg(this.orgId).subscribe(res => {
      if (res.documents) {
        if (res.documents.length > 0) {
           this.onFinish.emit();
        } else {
          this.toastrService.error('Minimun 1 document required to finish');
        }
      }
    });

  }
}
