import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { OrganizationsService, Organization } from '../../shared';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'fl-organization-company-registration',
  templateUrl: './organization-company-registration.component.html',
  styleUrls: ['./organization-company-registration.component.scss']
})
export class OrganizationCompanyRegistrationComponent implements OnInit {
  @Input() organization: Organization;
  data: any;
  check: boolean = false;
  regExrOrgForm = {
    gstin: '\\d{15}$',
    cin: '\\d{21}$',
    addressLine: '^([A-Za-z0-9]\\s?)+([,.]\\s?([A-Za-z0-9]\\s?)+)*$',
    city: '^[a-zA-Z]+(?:[\\s-][a-zA-Z]+)*$',
    code: '^\\d{5}$|^\\d{5}-\\d{4}$',
    country: '[a-zA-Z]{2,}',
    fax: '^(\\+)?(((((\\d+)|(\\(\\d+\\))|(\\(\\d+\\s(\\d)\\)))(\\s|-|\\d+))+)|((\\d+)|(\\(\\d+\\))$)+)+\\d$'
  };
  formInvalid: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private toastr: ToastrService,
    private organizationsService: OrganizationsService) { }

  /**
   * Registered Office details form
   */
  registeredOfficeDetails: FormGroup = this.formBuilder.group({
    name: ['', [Validators.required]],
    GSTIN:['',[Validators.required, Validators.pattern(this.regExrOrgForm.gstin), Validators.maxLength(15)]],
    CIN: ['', [Validators.required, Validators.pattern(this.regExrOrgForm.cin), Validators.maxLength(21)]],
    address: this.formBuilder.group({
      addressLine1: ['', [Validators.required, Validators.pattern(this.regExrOrgForm.addressLine)]],
      addressLine2: ['', Validators.pattern(this.regExrOrgForm.addressLine)],
      city: ['', [Validators.required, Validators.pattern(this.regExrOrgForm.city)]],
      regionState: ['', [Validators.required, Validators.pattern(this.regExrOrgForm.city)]],
      code: ['', [Validators.required, Validators.pattern(this.regExrOrgForm.code)]],
      country: ['', [Validators.required, Validators.pattern(this.regExrOrgForm.country)]]
    }),
    phoneNumbers: this.formBuilder.group({
      type: ['work'],
      number: ['', [Validators.required]]
    }),
    faxNumbers: this.formBuilder.group({
      type: ['work'],
      number: ['', [Validators.pattern(this.regExrOrgForm.fax)]]
    }),
    emails: this.formBuilder.group({
      type: ['work'],
      email: ['', [Validators.required, Validators.email]]
    })
  });

  ngOnInit() {
    this.getCurrentOrg();
  }

  updateOrganization(data) {
    this.check = true;

    if (!this.registeredOfficeDetails.valid) {
      this.toastr.error('Invalid organization details, please recheck.');
      this.check = false;
      this.formInvalid = true;
      return;
    }
    this.organizationsService.updateOrganization(data.value, this.organization._id).subscribe((value: any) => {
      this.toastr.success('Updated successfully.');
      this.getCurrentOrg();
      this.check = false;
      this.formInvalid = false;
    }, error => {
      this.toastr.error(error);
    });
  }

  getCurrentOrg() {
    this.organizationsService.getOrg(this.organization._id).subscribe((res: any) => {

      this.data = res.registeredOfficeDetails;
      var addressInfo = res.registeredOfficeDetails.address || {};
      var phoneNumbersInfo = res.registeredOfficeDetails.phoneNumbers || {};
      var faxNumbersInfo = res.registeredOfficeDetails.faxNumbers || {};
      var emailsInfo: any;
      res.registeredOfficeDetails.emails ? {} : emailsInfo = res.registeredOfficeDetails.emails[0].email;
      res.registeredOfficeDetails.email ? [] : emailsInfo = res.registeredOfficeDetails.emails;

      if (this.data) {
        this.registeredOfficeDetails.patchValue({
          GSTIN:this.data.GSTIN?this.data.GSTIN.toUpperCase():'',
          CIN: this.data.CIN,
          name: res.name,
          address: {
            addressLine1: addressInfo.addressLine1,
            addressLine2: addressInfo.addressLine2,
            city: addressInfo.city,
            regionState: addressInfo.regionState,
            code: addressInfo.code,
            country: addressInfo.country
          },
          phoneNumbers: {
            number: phoneNumbersInfo[0].number
          },
          faxNumbers: {
            number: faxNumbersInfo[0].number
          }
        });
      }

      if (emailsInfo.length > 0) {
        if (emailsInfo[0].email) {
          this.registeredOfficeDetails.patchValue({ emails: { email: emailsInfo[0].email } })
        }
        else if (emailsInfo.email) {
          this.registeredOfficeDetails.patchValue({ emails: { email: emailsInfo.email } })
        }
      }

    });
  }

  getformElem(formElemName) { return this.registeredOfficeDetails.get(formElemName); }
}
