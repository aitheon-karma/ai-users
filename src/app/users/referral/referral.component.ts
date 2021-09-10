import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { UserReferralService } from '../../dashboard/shared';
import { EmailValidators } from 'ng2-validators';

@Component({
  selector: 'fl-referral',
  templateUrl: './referral.component.html',
  styleUrls: ['./referral.component.scss']
})
export class ReferralComponent implements OnInit {

  referralForm: FormGroup;
  submitted = false;
  info: string;

  referralCode: string;
  referralCount: number;
  referralTokenAmount: number;
  isLoading = false;
  sending = false;
  isCopied = false;
  isCopiedLink = false;

  bonus = 7;
  bonusValue: number;
  referralLink: string;
  sentInvites: string[] = [];

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private userReferralService: UserReferralService
  ) { }

  ngOnInit() {
    this.isLoading = true;
    this.buildForm();
    this.userReferralService.getReferral().subscribe(
      (result: { referralCode: string, referralCount: number, referralTokenAmount: number }) => {
      this.referralCode = result.referralCode;
      this.referralLink = `${ window.location.protocol }//${ window.location.host }/users/signup#referral=${ this.referralCode }`;
      this.referralCount = result.referralCount;
      this.referralTokenAmount = result.referralTokenAmount;
      this.bonusValue = this.referralTokenAmount * (this.bonus / 100);
      this.isLoading = false;
    });
  }

  buildForm() {
    this.referralForm = this.fb.group({
      emails: ['', [Validators.required, this.alreadySentValidator.bind(this) ]]
    });
  }

  onSendReferral() {
    this.submitted = true;
    if (!this.referralForm.valid) {
      return;
    }
    this.info = null;
    const email = this.referralForm.get('emails').value;
    this.sending = true;
    this.userReferralService.inviteReferral(email).subscribe((result: { alreadyExist: string }) => {
      this.submitted = false;
      this.sending = false;
      this.referralForm.get('emails').setValue('');
      if (result.alreadyExist === 'all') {
        this.info = 'All emails is already registered. Referral code not sent';
      } else if (result.alreadyExist) {
        this.info = 'This emails already registered: ' + result.alreadyExist;
        this.toastr.success('Referral codes send to other email addresses.');
      } else {
        this.toastr.success('Referral codes sent.');
        this.sentInvites.push((email as string).toLocaleLowerCase());
      }
    }, (err) => {
      this.toastr.error(err);
      this.submitted = false;
      this.sending = false;
    });
  }

  copyOnSuccess(isCopiedLink: string) {
    if (isCopiedLink) {
      this.isCopiedLink = true;
      setTimeout(() => {
        this.isCopiedLink = false;
      }, 1000);
    } else {
      this.isCopied = true;
      setTimeout(() => {
        this.isCopied = false;
      }, 1000);
    }
  }

  alreadySentValidator(contorl: AbstractControl) {
   return this.sentInvites.includes(contorl.value.toLocaleLowerCase()) ? {alreadySent: true} : null;
  }

}
