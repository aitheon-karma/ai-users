import { Component, OnChanges, SimpleChanges, Output, EventEmitter, TemplateRef, ViewChild, Input } from '@angular/core';
import { AuthService } from '@aitheon/core-client';
import { BsModalRef, BsModalService } from 'ngx-bootstrap/modal';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';

@Component({
  selector: 'fl-second-factor-modal',
  templateUrl: './second-factor-modal.component.html',
  styleUrls: ['./second-factor-modal.component.scss']
})
export class SecondFactorModalComponent implements OnChanges {

  @Input() modalClass: string = '';
  @Input() error: string = '';
  @Output() success: EventEmitter<any> = new EventEmitter<any>();
  @ViewChild('secondFactorTml') secondFactorTml: TemplateRef<any>;

  secondFactorRef: BsModalRef;
  secondFactorForm: FormGroup;
  submitted = false;
  tempData: any;
  isWrongCode: boolean = false;
  isOpened: boolean = false;

  get code(): AbstractControl {
    return this.secondFactorForm.get('code');
  }

  constructor(
    private authService: AuthService,
    private modalService: BsModalService,
    private fb: FormBuilder
  ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.error?.currentValue) {
      this.isWrongCode = !!changes.error.currentValue;
    } else {
      this.isWrongCode = false;
    }
  }

  request(data: any) {
    this.tempData = data;
    this.authService.requestSecondFactor().subscribe((result: { status: string }) => {
      if (result.status === 'DISABLED') {
        return this.success.emit({ data: this.tempData, otpCode: '' });
      }
      this.buildForm();
      this.show();
    });
  }

  public resetForm(): void {
    this.secondFactorForm.reset();
  }

  public hideModal(): void {
    this.secondFactorRef.hide();
    this.isOpened = false;
  }

  private show() {
    this.secondFactorRef = this.modalService.show(this.secondFactorTml, { class: this.modalClass || '' });
    this.isOpened = true;
  }

  private buildForm() {
    this.secondFactorForm = this.fb.group({
      code: ['', [Validators.required]]
    });

    this.code.valueChanges
      .subscribe(value => {this.isWrongCode = false});
  }

  onSubmit() {
    this.submitted = true;

    if (this.secondFactorForm.invalid) {
      return;
    }

    this.submitted = false;
    this.success.emit({ data: this.tempData, otpCode: this.secondFactorForm.get('code').value });
  }
}
