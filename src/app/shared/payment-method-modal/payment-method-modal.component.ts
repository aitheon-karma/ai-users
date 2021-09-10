import { Component, OnInit, ViewChild, Output, EventEmitter, Input } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ModalDirective } from 'ngx-bootstrap/modal';
import { Exchange, FiatAccount, Account, InboundProvidersRestService } from '@aitheon/treasury';
// import { TreasuryRestService } from '@aitheon/billing-manager';
import { map } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
// import { BluesnapSciptLoader } from '../../shared/services/bluesnap-script-loader.service';
import { ToastrService } from 'ngx-toastr';
declare const BlueSnap: any;

@Component({
  selector: 'ai-payment-method-modal',
  templateUrl: './payment-method-modal.component.html',
  styleUrls: ['./payment-method-modal.component.scss']
})
export class PaymentMethodModalComponent implements OnInit {


  @Input() acuBalance: number = undefined;

  stepOne = false;
  stepTwo = false;
  success = false;
  failed = false;
  loadingAccount = false;
  buyAcuForm: FormGroup;
  createAccountForm: FormGroup;
  accounts: FiatAccount[];
  exchange: Exchange;
  loading = true;
  createAccountMode = true;
  accountSubmitted = false;
  bluesnap: any;
  currentYear = (new Date()).getFullYear();
  cardYears = Array(20).fill(0).map((item, index) => ({ name: (this.currentYear + index).toString() }));
  cardMonths = Array(12).fill(0).map((item, index) => ({ name: index < 9 ? '0' + (index + 1) : index + 1 }));
  accountTypes: any;
  dueDateOptions = Array(31).fill(0).map((item, index) => ({ name: index < 9 ? '0' + (index + 1) : index + 1 }));
  pattern = /[0-9]/;

  readonly INITIAL_PRICE = 25;

  @ViewChild('buyAcuModal') buyAcuModal: ModalDirective;
  @Output() purchaseSuccess = new EventEmitter<boolean>();
  @Output() closeModalEvent = new EventEmitter<boolean>();

  constructor(
    private fb: FormBuilder,
    // private treasuryService: TreasuryRestService,
    // private blueSnapScriptLoader: BluesnapSciptLoader,
    private toastr: ToastrService,
    private inboundProvider: InboundProvidersRestService
  ) {}

  ngOnInit() {

    // forkJoin(this.treasuryService.fiatAccounts(), this.treasuryService.currentExchangeRate())
    //   .pipe(map(results => ({ accounts: results[0], exchange: results[1] })))
    //   .subscribe(results => {
    //     this.exchange = results.exchange;
    //     this.accounts = results.accounts.filter((a: FiatAccount) => (a.allowedOperations.includes('INBOUND') && a.inboundProvider ));
        this.buildCreateAccountForm();
    //     this.loading = false;
    //   });
    // this.inboundProvider.key().subscribe(key => {
    //   this.loadBlueSnapScript(atob(key.clientKey));
    // });
    // this.accountTypes = this.typeOptions();
  }

  buildCreateAccountForm() {
    this.createAccountForm = this.fb.group({
      bankName: [''],
      type: [null],
      cardHolderFirstName: ['', Validators.required],
      cardHolderLastName: ['', Validators.required],
      lastDigits: [''],
      creditCard: ['', [Validators.required]],
      expirationMonth: [null, Validators.required],
      expirationYear: [null, Validators.required],
      cvv: [''],
      dueDate: [null],
    });
  }

  goToStepOne() {
    this.stepTwo = false;
    this.stepOne = true;
  }

  goToStepTwo() {
    this.stepOne = false;
    this.stepTwo = true;
    this.failed = false;
  }

  goToSuccess() {
    this.stepOne = false;
    this.stepTwo = false;
    this.success = true;
    this.failed = false;
  }

  show() {
    this.buyAcuModal.show();
  }

  close() {
    // this.buildForm();
    this.closeModalEvent.emit(true);
    this.success = false;
    this.failed = false;
    this.accountSubmitted = false;
  }

  tryPaymentAgain() {
    this.failed = false;
    this.stepOne = true;
  }

  onCreateAccountMode() {
    this.buildCreateAccountForm();
    this.createAccountMode = true;
  }

  onAccountSubmit() {
    this.accountSubmitted = true;
    if (this.createAccountForm.invalid) {
      return;
    }

    this.bluesnap.encrypt('account-form');
    const form: any = document.getElementById('account-form');
    const inputs: HTMLInputElement[] = form.querySelectorAll('input');
    const cardInfo: any = {};


    for (const item of inputs) {
      if (item.name === 'encryptedCreditCard') {
        cardInfo.encryptedCreditCard = item.value;
      } else if (item.name === 'encryptedCvv') {
        cardInfo.encryptedCvv = item.value;
      }
    }
    const value = Object.assign({}, this.createAccountForm.value);
    cardInfo.cardHolderFirstName = value.cardHolderFirstName;
    cardInfo.cardHolderLastName = value.cardHolderLastName;
    cardInfo.bankName = `${value.cardHolderFirstName} ${value.cardHolderLastName}`;
    cardInfo.type = FiatAccount.TypeEnum.SAVINGS;

    cardInfo.expirationMonth = value.expirationMonth;
    cardInfo.dueDate = value.dueDate;
    cardInfo.expirationYear = value.expirationYear;

    const cardNumber = (value.creditCard as number).toString();
    const account = {
      bankName:  `${value.cardHolderFirstName} ${value.cardHolderLastName}`,
      lastDigits: cardNumber.substr(cardNumber.length - 4, cardNumber.length),
      type: FiatAccount.TypeEnum.SAVINGS
    };
    const inboundAccount = {account, cardInfo};
    console.log(inboundAccount);
    this.loadingAccount = true;
    // this.treasuryService.createInboundFiatAccount(inboundAccount)
    //   .subscribe(fiatInboundAccount => {
    //     this.accounts.push(fiatInboundAccount);
    //     this.stepTwo = true;
    //     this.createAccountMode = false;
    //     this.accountSubmitted = false;
    //     this.loadingAccount = false;
    //   }, err => { this.toastr.error(err.error.message); this.loadingAccount = false; });

  }

  private loadBlueSnapScript(key: string) {
    // this.blueSnapScriptLoader.load('bluesnap').then(data => {
    //     this.bluesnap = new BlueSnap(key, false);
    //   }
    // ).catch(error => this.toastr.error('Could not load Blue Snap'));
  }

  typeOptions() {
    const types = [];
    // tslint:disable-next-line: forin
    for (let type in FiatAccount.TypeEnum) {
      type = type.toString();
      types.push({
        displayText: type.length > 2 ? type.charAt(0).toUpperCase() + type.toLocaleLowerCase().slice(1) : type,
        value: type
      });
    }
    return types;
  }
}

