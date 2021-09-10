import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@aitheon/core-client';
import { PaymentsService } from '../shared/payments.service';
import { Payment } from '../shared/payment';

@Component({
  selector: 'fl-buy-tokens',
  templateUrl: './buy-tokens.component.html',
  styleUrls: ['./buy-tokens.component.scss']
})
export class BuyTokensComponent implements OnInit, OnChanges {


  @Input() saleActive: Boolean;
  @Output() paymentCreated: EventEmitter<Payment> = new EventEmitter<Payment>();
  @Output() walletSaved: EventEmitter<{ ethWalletAddress: string }> = new EventEmitter<{ ethWalletAddress: string }>();

  walletForm: FormGroup;
  calcForm: FormGroup;
  submitted = false;
  walletEditModeBtc = false;
  walletEditModeEth = false;
  walletEditModeLtc = false;
  savingWallet = false;
  isCopied = false;
  user: any;
  rates: any;

  paymentSubmitted = false;

  coinpaymentsAmount: any = 10;
  selectedCoin: string;
  paymentError: string;
  redirectTimeout: number;

  constructor(
    private fb: FormBuilder,
    private toastr: ToastrService,
    private paymentsService: PaymentsService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.authService.currentUser.subscribe((user: any) => {
      this.user = user;
    })
  }

  /*buildForm(userWallet: UserWallet) {
    this.walletEditModeEth = !userWallet.ethWalletAddress;
    this.walletEditModeBtc = !userWallet.bitcoinWalletAddress;
    this.walletEditModeLtc = !userWallet.litecoinWalletAddress;
    this.walletForm = this.fb.group({
      _id: userWallet ? userWallet._id : undefined,
      ethWalletAddress: [userWallet.ethWalletAddress, [Validators.required]],
      bitcoinWalletAddress: [userWallet.bitcoinWalletAddress, [Validators.required]],
      litecoinWalletAddress: [userWallet.litecoinWalletAddress, [Validators.required]]
    });
    this.calcForm = this.fb.group({
      ETH: '',
      BTC: '',
      LTC: '',
      AITHEON_TOKEN: '',
      USD: ''
    });
    this.calcForm.get('ETH').valueChanges.subscribe((ETH: number) => {
      const usd = parseFloat((ETH * this.cryptoSettings.ETH.USD).toFixed(5));
      this.calcPrices(usd);
    });

    this.calcForm.get('USD').valueChanges.subscribe((USD: number) => {
      this.calcPrices(USD);
    });

    this.calcForm.get('AITHEON_TOKEN').valueChanges.subscribe((AITHEON_TOKEN: number) => {
      const usd = parseFloat((this.cryptoSettings.AITHEON_TOKEN.USD * AITHEON_TOKEN).toFixed(5));
      this.calcPrices(usd);
    });

    this.calcForm.get('BTC').valueChanges.subscribe((BTC: number) => {
      const usd = parseFloat((BTC * this.cryptoSettings.BTC.USD).toFixed(5));
      this.calcPrices(usd);
    });

    this.calcForm.get('LTC').valueChanges.subscribe((LTC: number) => {
      const usd = parseFloat((LTC * this.cryptoSettings.LTC.USD).toFixed(5));
      this.calcPrices(usd);
    });
  }

  tabSelected() {
    this.calcPrices(this.calcForm.get('USD').value);
  }

  calcPrices(usd: number) {
    console.log('usd:', usd);
    if (!usd) {
      usd = 0;
    }
    const eth = parseFloat((usd / this.cryptoSettings.ETH.USD).toFixed(5));
    const btc = parseFloat((usd / this.cryptoSettings.BTC.USD).toFixed(5));
    const ltc = parseFloat((usd / this.cryptoSettings.LTC.USD).toFixed(5));
    const aitheon = parseFloat((usd / this.cryptoSettings.AITHEON_TOKEN.USD).toFixed(0));

    this.calcForm.get('AITHEON_TOKEN').setValue(aitheon, { emitEvent: false });
    this.calcForm.get('USD').setValue(usd, { emitEvent: false });
    this.calcForm.get('ETH').setValue(eth, { emitEvent: false });
    this.calcForm.get('BTC').setValue(btc, { emitEvent: false });
    this.calcForm.get('LTC').setValue(ltc, { emitEvent: false });
  }

  toggleEditMode(form: string) {
    this[`walletEditMode${form}`] = !this[`walletEditMode${form}`];
    this.savingWallet = false;
    this.submitted = false;
  }
*/
  ngOnChanges(): void {
   /* if (this.userWallet) {
      this.buildForm(this.userWallet);
      if (!this.coinpaymentsAmount) {
        this.coinpaymentsAmount = this.cryptoSettings.AITHEON_TOKEN.USD;
      }
      this.loadRates();
    }*/
  }
/*
  onSaveWallet(formName: string) {
    this.submitted = true;
    if (!this.walletForm.get(formName).valid) {
      return;
    }
    const formValue = {
      _id: this.userWallet._id || undefined
    } as UserWallet;
    formValue[formName] = this.walletForm.get(formName).value;
    this.savingWallet = true;
    this.userWalletService.save(formValue).subscribe((wallet: UserWallet) => {
      this.userWallet = wallet;
      this.walletForm.get('_id').setValue(wallet._id);
      this.toastr.success('Wallet saved');
      this.submitted = false;
      this.savingWallet = false;
      if (formName === 'ethWalletAddress') {
        console.log('this.userWallet.ethWalletAddress', this.walletForm.get(formName).value);
        this.walletSaved.emit({ ethWalletAddress: this.walletForm.get(formName).value });
        this.toggleEditMode('Eth');
      } else if (formName === 'bitcoinWalletAddress') {
        this.toggleEditMode('Btc');
      } else if (formName === 'litecoinWalletAddress') {
        this.toggleEditMode('Ltc');
      }
    }, (err) => {
      this.toastr.error(err);
      this.submitted = false;
      this.savingWallet = false;
    });
  }

  copyOnSuccess() {
    this.isCopied = true;
    setTimeout(() => {
      this.isCopied = false;
    }, 3000);
  }

  buyWithCoinpayments() {
    if (this.paymentSubmitted) {
      return;
    }
    this.paymentError = '';
    if (!this.selectedCoin ) {
      this.paymentError = 'Please select a coin';
      return;
    }
    if (this.coinpaymentsAmount < this.cryptoSettings.AITHEON_TOKEN.USD) {
      this.paymentError = 'Please enter an amount';
      return;
    }
    this.paymentSubmitted = true;
    this.paymentsService.createTransactions(this.selectedCoin, this.coinpaymentsAmount).subscribe((result: Payment) => {
      console.log('buyWithCoinpayments: ', result);
      this.redirectTimeout = 5;
      this.paymentSubmitted = false;
      this.paymentCreated.emit(result);
    }, (err: any) => {
      this.paymentSubmitted = false;
      this.toastr.error(err);
    })
  }

  selectCoin(rate: any) {
    this.selectedCoin = rate.key;
  }

  loadRates() {
    this.paymentsService.rates().subscribe((rates: any) => {
      this.rates = rates;
      this.refreshRates();
    }, (err: any) => {
      this.toastr.error(err);
    })
  }

  coinpaymentsAmountChanged() {
    this.refreshRates();
  }

  refreshRates() {
    this.rates = this.rates.map((rate: any) => {
      rate.rate_usd = ((parseFloat(rate.rate_btc) + parseFloat(rate.tx_fee)) * this.cryptoSettings.BTC.USD).toFixed(7);
      if (!this.coinpaymentsAmount) {
        rate.rate_aic = '-';
      } else {
        rate.rate_aic = (this.coinpaymentsAmount / rate.rate_usd).toFixed(7);
      }
      return rate;
    });
  }*/

}
