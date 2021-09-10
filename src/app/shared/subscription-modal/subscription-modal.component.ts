import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Organization } from "../../organizations/shared";
import { Service } from "../../services/shared";
import { FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';

interface SelectedService extends Service {
  service: string
}

interface BillChange {
  action?: string,
  feature?: string,
  price?: number,
  amount?: number
}

@Component({
  selector: 'ai-subscription-modal',
  templateUrl: './subscription-modal.component.html',
  styleUrls: ['./subscription-modal.component.scss']
})
export class SubscriptionModalComponent implements OnInit {
  @Input() service: SelectedService;
  @Output() closeModalEvent: EventEmitter<boolean> = new EventEmitter();
  @Output() createPaymentMethodEvent: EventEmitter<boolean> = new EventEmitter();

  totalPrice: number = 0;
  dummyFeatures = [
    {
      name: 'Tag',
      price: '20',
      seats: 20,
      seatsOccupied: 18
    },
    {
      name: 'User',
      price: '60',
      seats: 14,
      seatsOccupied: 10
    },
    {
      name: 'Robot',
      price: '40',
      seats: 4,
      seatsOccupied: 4
    }
  ] as any;
  userCards = [
    {
      value: '1234',
      name: '**** **** **** 1234'
    },
    {
      value: '3255',
      name: '**** **** **** 3255'
    }
  ];
  subscriptionForm: FormGroup;
  features: FormGroup;
  formControls: any;
  changesHistory: BillChange[] = [];

  constructor(private fb: FormBuilder) { }

  ngOnInit(): void {
    this.buildForm()
  }

  closeModal() {
    this.closeModalEvent.emit(true);
  }

  getFormControls() {
    this.formControls = this.subscriptionForm.controls;
  }


  private buildForm() {
    this.formFeaturesGroup();

    this.subscriptionForm = this.fb.group({
      card: [null, Validators.required],
      termsAgree: [null, Validators.required],
      features: this.features
    });

    this.getFormControls();
  }

  private formFeaturesGroup() {
    let featureGroup = {};
    this.dummyFeatures.forEach(featureTemplate => {
      featureGroup[featureTemplate.name.toLowerCase()] = new FormControl(featureTemplate.seats);
    })
    this.features = this.fb.group(featureGroup);
  }

  changeSeatsAmount(selectedAction: string, selectedFeature: string) {
    const feature = this.subscriptionForm.get('features').get(selectedFeature);
    const calculatedSeats = selectedAction === 'minus' ? feature.value - 1 : feature.value + 1;
    if (calculatedSeats < 0) {
      return;
    }
    feature.patchValue(calculatedSeats);

    this.writeChangeToHistory(selectedFeature);
  }

  writeChangeToHistory(feature: string) {
    const payload: BillChange = {};
    const featureToChange = this.dummyFeatures.filter((item: any) => item.name.toLowerCase() === feature)[0];
    const foundIndex = this.changesHistory.findIndex(x => x.feature.toLowerCase() == feature);

    payload.feature = featureToChange.name;

    if (featureToChange.seats < this.formControls.features.value[feature]) {
      payload.action = 'Adding';
      payload.amount = this.formControls.features.value[feature] - featureToChange.seats;
      payload.price = payload.amount * featureToChange.price;
    } else {
      payload.action = 'Removing';
      payload.amount = featureToChange.seats - this.formControls.features.value[feature];
    }

    if (foundIndex !== -1) {
      if (payload.amount === 0) {
        this.changesHistory.splice(foundIndex, 1);
      } else {
        this.changesHistory[foundIndex] = payload;
      }
    } else {
      this.changesHistory.push(payload);
    }

    this.calculateTotalBill();
  }

  private calculateTotalBill() {
    const totalPriceChanges = [];
    this.changesHistory.forEach(change => {
      if (change.price > 0) {
        totalPriceChanges.push(change.price);
      }
    })
    this.totalPrice = totalPriceChanges.reduce((a, b) => a + b, 0);
  }

  saveAndPay() {
    console.log('Form Send --> ', this.subscriptionForm.value);
  }

  createPaymentMethod() {
    this.createPaymentMethodEvent.emit(true);
  }
}
