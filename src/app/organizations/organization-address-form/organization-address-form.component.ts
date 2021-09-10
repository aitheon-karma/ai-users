import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { FormGroup, FormBuilder, Validators, NgForm, FormArray} from '@angular/forms';
import { OrganizationsService, Organization } from '../shared';
import { ToastrService } from 'ngx-toastr';
import { Address } from '../../shared/Location';

@Component({
  selector: 'fl-organization-address-form',
  templateUrl: './organization-address-form.component.html',
  styleUrls: ['./organization-address-form.component.scss']
})
export class OrganizationAddressFormComponent implements OnInit {
  @Input() organization: Organization;
  @Input() address: Address;
  @Output() canceled: EventEmitter<any> = new EventEmitter<any>();
  @Output() saved: EventEmitter<Organization> = new EventEmitter<Organization>();

  submitted = false;
  addressForm: FormGroup;
  error: any;
  activeParent: any;

  countries: Array<string> = ['United States', 'Canada', 'Ukraine'];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private organizationsService: OrganizationsService,
    private route: ActivatedRoute) { }

  get isNew() {
    if ( this.address ) {
      return this.address && !this.address._id;
    }
    return true;
  }
  get activeCountry() {
    const val = this.addressForm.get('address.country').value;
    return [{ id: val, text: val }];
  }

  ngOnInit() {
    this.buildForm(this.address);
  }

  buildForm(address: Address): void {
    this.addressForm = this.fb.group({
      name: 'Location 1',

      address: this.fb.group({
        line1: [address ? address.addressLine1 : null, Validators.required],
        line2: [address ? address.addressLine2 : null, Validators.required],
        state: [address ? address.regionState : null, Validators.required],
        city: [address ? address.city : null, Validators.required],
        zip: [address ? address.code : null, Validators.required],
        country: [address ? address.country : null, Validators.required]
      }),
    });
  }

  onSubmit({ value, valid }: { value: Address, valid: boolean }): void {
    this.submitted = true;
    if (!valid) {
      return;
    }
    if (this.isNew) {
      this.createAddress(this.organization, value);
    } else {
      this.updateOrgAddress(this.organization, value);
    }
  }

  createAddress(organization: Organization, address: Address): void {
    this.organizationsService.createNewAddress(organization, address).subscribe((o: Organization) => {
      this.organization._id = o._id;
      this.toastr.success('Address Added');
      this.saved.emit(this.organization);
    }, (error) => this.handleError(error));
  }

  updateOrgAddress(organization: Organization, address: Address) {
    this.organizationsService.updateCurrentAddress(organization, address, this.address._id).subscribe((o: Organization) => {
      this.organization._id = o._id;
      this.toastr.success('Address Updated');
      this.saved.emit(this.organization);
    }, (error) => this.handleError(error));
  }

  handleError(response: any) {
    try {
      response = JSON.parse(response);
      response = response.message;
    } catch (err) { }
     this.error = response;
  }

  cancel(): void {
    this.addressForm.reset(this.organization);
    this.canceled.emit();
  }

}
