import {Component, Input, OnInit, TemplateRef, ViewChild} from '@angular/core';
import { BsModalRef, BsModalService } from "ngx-bootstrap/modal";
import { ToastrService } from "ngx-toastr";
import { Organization, OrganizationsService } from "../shared";

@Component({
  selector: 'ai-organization-locations',
  templateUrl: './organization-locations.component.html',
  styleUrls: ['./organization-locations.component.scss']
})
export class OrganizationLocationsComponent implements OnInit {
  selectedLocation: any;
  locationModalRef: BsModalRef;
  loadingList = false;
  locationsListCopy: any[];
  @ViewChild('locationModal') locationModal: TemplateRef<any>;
  @Input() organization: Organization;

  constructor(
    private toastr: ToastrService,
    private modalService: BsModalService,
    private organizationsService: OrganizationsService
  ) { }

  ngOnInit() {
    if (this.organization.locations) {
      this.locationsListCopy = this.organization.locations;
    }
  }

  openLocationModal(location: any = {}) {
    this.selectedLocation = location;
    this.locationModalRef = this.modalService.show(this.locationModal, {
      backdrop: 'static',
      ignoreBackdropClick: true,
      class: 'organization-modal'
    });
  }

  updateLocationsList(message: string) {
    this.loadingList = true;

    this.organizationsService.getAllLocations(this.organization._id).subscribe(locations => {
      this.organization.locations = this.locationsListCopy = locations;
      this.loadingList = false;
    })

    this.locationModalRef.hide();
    setTimeout(() => this.toastr.success(message), 1000);
  }

  searchLocations(value: string) {
    if (value.length > 2 || value === '') {
      this.locationsListCopy = [...this.organization.locations].filter(location => {
        return location.name.toLowerCase().includes(value.toLowerCase());
      });
    }
  }
}
