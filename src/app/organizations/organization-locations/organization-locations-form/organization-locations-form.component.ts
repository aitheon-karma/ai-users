import { Component, OnInit, Input, Output, EventEmitter, ViewChild, QueryList } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { ToastrService } from "ngx-toastr";
import { DriveUploaderComponent } from '@aitheon/core-client';
import { Location } from "../../../shared/Location";
import { OrganizationsService } from "../../shared";
import { SwalComponent } from '@sweetalert2/ngx-sweetalert2';

@Component({
  selector: 'ai-organization-locations-form',
  templateUrl: './organization-locations-form.component.html',
  styleUrls: ['./organization-locations-form.component.scss']
})
export class OrganizationLocationsFormComponent implements OnInit {
  @ViewChild("driveUploader") driveUploader: DriveUploaderComponent;
  @ViewChild('dialog') private swalDialog: SwalComponent;
  @Input() location: any;
  @Input() organization: any;
  @Output() canceled = new EventEmitter();
  @Output() submitted = new EventEmitter<string>();

  locationForm: FormGroup;
  isSubmitted: boolean;
  serviceKey: { _id: string; key: string };
  typeList = [{
    name: 'Warehouse',
    value: 'WAREHOUSE'
  }, {
    name: 'Office',
    value: 'OFFICE'
  }, {
    name: 'Factory',
    value: 'FACTORY'
  }, {
    name: 'Other',
    value: 'OTHER'
  }];
  telFieldColor = '#7e7e7e';
  cyrillicPattern = '^([A-Za-z0-9.,(/\\\\/)-/\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff\\s]*)$';
  loading = false;

  constructor(private fb: FormBuilder,
              private toastr: ToastrService,
              private organizationsService: OrganizationsService) { }

  ngOnInit(): void {

    if (this.location) {
      this.buildForm();
    }

    this.serviceKey = {
      _id: "USERS",
      key: `${this.organization._id}`
    };
  }

  buildForm() {
    this.isSubmitted = false;
    this.locationForm = this.fb.group({
      logo: [this.location?.logo || null],
      name: [this.location.name || '', [Validators.required, Validators.minLength(2), this.emptySpaceValidator, Validators.pattern(this.cyrillicPattern)]],
      type: [this.location.type || null, Validators.required],
      phoneNumber: [this.location?.phoneNumbers ? this.location?.phoneNumbers[0]?.number : '', [Validators.minLength(11)]],
      email: [this.location?.emails ? this.location?.emails[0]?.email : '', Validators.email],
      address: this.fb.group({
        addressLine1: this.fb.control(this.location.address?.addressLine1 || '', [Validators.required, Validators.minLength(2), this.emptySpaceValidator, Validators.pattern(this.cyrillicPattern)]),
        addressLine2: this.fb.control(this.location.address?.addressLine2 || ''),
        regionState: this.fb.control(this.location.address?.regionState || ''),
        city: this.fb.control(this.location.address?.city || '', [Validators.required, Validators.minLength(2), this.emptySpaceValidator, Validators.pattern(this.cyrillicPattern)]),
        code: this.fb.control(this.location.address?.code || '', [Validators.required, Validators.pattern('^\\d{5}(?:[-\\s]\\d{4})?$')]),
        country: this.fb.control(this.location.address?.country || '', [Validators.required, Validators.minLength(2), this.emptySpaceValidator, Validators.pattern(this.cyrillicPattern)]),
      }),
    });
    this.telFieldColor = this.locationForm.get('phoneNumber').value === '' ? '#7e7e7e' : '#fff';
  }

  closeModal() {
    this.canceled.emit();
  }

  submitLocationForm() {
    this.isSubmitted = true;
    if (this.locationForm.invalid) {
      return;
    }

    const location = {
      ...this.locationForm.value,
      phoneNumbers: [{ number: this.locationForm.value.phoneNumber, type: "WORK" }],
      emails: [{ email: this.locationForm.value.email, type: "WORK" }],
      faxNumbers: [],
      _id: this.location._id
    };

    this.updateLocation(location);
  }

  private updateLocation(location: Location) {
    this.loading = true;
    if (location._id) {
      this.organizationsService.updateLocation(location as Location)
      .subscribe(data => {
        this.submitted.emit('Location updated');
        this.loading = false;
      }, error => {
        console.log(error);
        this.loading = false;
      });
    } else {
      this.organizationsService.createLocation(location as Location)
      .subscribe(data => {
        this.submitted.emit('Location created');
        this.loading = false;
      }, error => {
        console.log(error);
        this.loading = false;
      });
    }
  }

  get controls(): any {
    return this.locationForm.controls;
  }

  failedUpload(event: any) {
    this.toastr.error("File upload failed");
  }

  onSuccessUpload(event: any) {
    this.location.logo = {
      signedUrl: event.signedUrl,
      name: event.name,
      contentType: event.contentType
    };
    this.locationForm.get('logo').patchValue(this.location.logo);
  }

  onAfterAdd(event: any) {
    let sizeNotAllowed = false;
    let typeNotAllowed = false;
    let errorMessage = "";
    if ((event.file.size / 1000 / 1000) > 3) {
      sizeNotAllowed = true;
      errorMessage = "File size limit exceeded, should be less than 3 MB.";
    }
    if (!event.file.type.match("image.*")) {
      typeNotAllowed = true;
      errorMessage = "File type unknown, only JPG/PNG allowed.";
    }
    if (sizeNotAllowed || typeNotAllowed) {
      this.driveUploader.uploader.cancelAll();
      this.driveUploader.uploader.clearQueue();
      this.toastr.error(errorMessage);
    }
  }

  fillTel(e: any) {
    this.telFieldColor = e.target.value.charAt(1) === '_' ? '#7e7e7e' : '#fff';
  }

  removeLocation(locationId: string, locationName: string) {

    this.swalDialog['type'] = 'warning';
    this.swalDialog.swalOptions = {
      confirmButtonText: 'Remove',
      title: 'Remove Location',
      buttonsStyling: false,
      confirmButtonClass: 'button button--error button--medium button--ghost',
      cancelButtonClass: 'button button--ghost button--medium',
      showCancelButton: true,
      text: `Are you sure you want to remove «${locationName}» Location?`
    } as any;

    this.swalDialog.fire().then((result) => {
      if (result.value == true) {
        this.onRemoveLocation(locationId);
      } else {
        return;
      }
    });
  }

  onRemoveLocation(locationId: string) {
    this.organizationsService.removeLocation(locationId)
      .subscribe(data => {
        this.submitted.emit('Location removed');
      });
  }

  // private updateLocations(locations: Location[]) {
  //   this.organizationsService.processMultipleLocations(this.organization._id, locations as Location[])
  //     .subscribe(data => {
  //       this.toastr.success(data.message);
  //       this.submitted.emit(true);
  //     });
  // }

  private formValidLocations() {
    let location = {...this.locationForm.value};
    let locationsCopy = [...this.organization?.locations];
    delete location.email;
    delete location.phoneNumber;
    location.faxNumbers = [];
    location.phoneNumbers = [{ number: this.locationForm.value.phoneNumber, type: "WORK" }];
    location.emails = [{ email: this.locationForm.value.email, type: "WORK" }];
    if (this.location._id) {
      location._id = this.location._id;
    }
    const locations = locationsCopy.filter(locationToFilter => locationToFilter._id !== location._id);
    locations.push(location);

    return locations;
  }

  emptySpaceValidator(c: FormControl) {
    return c.value.replace(/\s/g, '').length ? null : {
      spaceValidator: {
        valid: false
      }
    }
  }
}
