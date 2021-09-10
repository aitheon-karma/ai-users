import { Component, OnInit, Input, ViewChild, ViewChildren, QueryList } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray } from '@angular/forms';
import { OrganizationsService, Organization } from '../../shared';
import { ToastrService } from 'ngx-toastr';
import { Location, PhoneNumberType, EmailType } from '../../../shared/Location';
import { DriveUploaderComponent } from '@aitheon/core-client';

@Component({
  selector: 'fl-organization-locations',
  templateUrl: './organization-locations.component.html',
  styleUrls: ['./organization-locations.component.scss']
})
export class OrganizationLocationsComponent implements OnInit {

  @ViewChildren("driveUploader") driveUploaders: QueryList<DriveUploaderComponent>;
  group: FormGroup;
  locationsForm: FormGroup;
  locations: any[];
  submitted = false;
  loading = true;
  type = ['WAREHOUSE', 'OFFICE', 'FACTORY', 'OTHER'];
  currentSelectedType = '';
  typeConfig = {
    search: false,
    placeholder: 'Select type',
  };
  currentSelectedLocationId: any;
  serviceKey: { _id: string; key: string };

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private organizationsService: OrganizationsService) { }
  @Input() organization: Organization;

  ngOnInit() {
    this.getAllLocations();
  }

  setType({ value }: any, id, index) {
    this.currentSelectedType = value;
    this.currentSelectedLocationId = id;
    if (value === 'OTHER') {

      const formArray = this.locationsForm.get('locations') as FormArray;
      let item = formArray.at(index) as FormGroup;

      item.get('type').setValue('');

      return;
    }
    // this.group.get('type').setValue(value);
  }

  getAllLocations() {
    this.organizationsService.getAllLocations(this.organization._id).subscribe((locations) => {
      this.generateLocationArray(locations);
      this.loading = false;
      this.serviceKey = {
        _id: "USERS",
        key: `${this.organization._id}`
      };
    });
  }

  removeLocation(index: number) {
    this.locationsArray.removeAt(index);
  }

  generateLocationArray(locations: Location[]) {
    this.locations = locations;
    const groups = locations.map(loc => {
      if (!loc.phoneNumbers[0]) {
        loc.phoneNumbers[0] = {
          number: '',
          type: PhoneNumberType.WORK
        };
      }

      if (!loc.emails[0]) {
        loc.emails[0] = {
          email: '',
          type: EmailType.WORK
        };
      }


      this.group = this.fb.group({
        name: [loc.name, [Validators.required]],
        type: [loc.type, [Validators.required]],
        phoneNumber: [loc.phoneNumbers[0].number],
        email: [loc.emails[0].email],
        address: this.fb.group({
          addressLine1: [loc.address.addressLine1, Validators.required],
          addressLine2: [loc.address.addressLine2],
          regionState: [loc.address.regionState, Validators.required],
          city: [loc.address.city, Validators.required],
          code: [loc.address.code, Validators.required],
          country: [loc.address.country, Validators.required],
        }),
        _id: [loc._id]
      });
      return this.group;
    });
    this.locationsForm = this.fb.group({
      locations: this.fb.array(groups)
    });
  }

  addLocation() {
    this.currentSelectedType = '';
    this.submitted = false;
    this.group = this.fb.group({
      name: ['', [Validators.required]],
      type: ['', [Validators.required]],
      phoneNumber: [''],
      email: [''],
      address: this.fb.group({
        addressLine1: ['', Validators.required],
        addressLine2: [''],
        regionState: [''],
        city: [''],
        code: ['', Validators.required],
        country: ['', Validators.required],
      }),
      _id: ['']
    });
    this.locationsArray.push(this.group);
  }

  onSubmit() {
    this.submitted = true;
    if (!this.locationsForm.valid) {
      return;
    }

    const locations = this.locationsForm.value.locations.map((loc, i) => {
      loc.phoneNumbers = [];
      loc.emails = [];
      loc.emails.push({ email: loc.email, type: EmailType.WORK });
      loc.phoneNumbers.push({ number: loc.phoneNumber, type: PhoneNumberType.WORK });
      loc.logo = this.locations[i]?.logo;
      delete loc.phoneNumber;
      delete loc.email;
      return loc;
    });



    locations.forEach(element => {
      if (element._id == '') {
        delete element._id;
      }
    });

    this.loading = true;
    this.organizationsService.processMultipleLocations(this.organization._id, locations as Location[])
      .subscribe(data => {
        this.toastr.success(data.message);
        this.loading = false;
      });
  }

  currentGroup(index: number) {
    return (this.locationsForm.get('locations') as FormArray).controls[index] as FormGroup;
  }

  get locationsArray() {
    return this.locationsForm.get('locations') as FormArray;
  }

  failedUpload(event: any) {
    this.toastr.error("File upload failed");
  }

  onAfterAdd(event, i: number) {
    let sizeNotAllowed = false;
    let typeNotAllowed = false;
    let errorMessage = "";
    if (!(event.file.size / 1000 / 1000 < 3)) {
      sizeNotAllowed = true;
      errorMessage = "File size limit exceeded, should be less than 3 MB.";
    }
    if (!event.file.type.match("image.*")) {
      typeNotAllowed = true;
      errorMessage = "File type unknown, only JPG/PNG allowed.";
    }
    if (sizeNotAllowed || typeNotAllowed) {
      this.driveUploaders[i].uploader.cancelAll();
      this.driveUploaders[i].uploader.clearQueue();
      this.toastr.error(errorMessage);
    }
  }

  onSuccessUpload(event: any, i: number) {
    if (this.locations[0]?.logo) {
      this.locations[0].logo = {
        signedUrl: event.signedUrl,
        name: event.name,
        contentType: event.contentType
      };
    }
  }

}
