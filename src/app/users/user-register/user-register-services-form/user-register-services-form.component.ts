import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Service, ServicesService } from '../../../services/shared';
import { FormBuilder, FormGroup, FormArray } from '@angular/forms';

@Component({
  selector: 'fl-user-register-services-form',
  templateUrl: './user-register-services-form.component.html',
  styleUrls: ['./user-register-services-form.component.scss']
})
export class UserRegisterServicesFormComponent implements OnInit {

  @Input() allServices: Service[];
  @Input() enabledServices: string[];
  error: any;

  selectedService: Service;

  constructor(private fb: FormBuilder) { }


  servicesForm: FormGroup;


  @Output() saved = new EventEmitter<Array<{enabled: boolean, service: Service}>>();

  ngOnInit() {


    if (!this.allServices.filter(s => (!s.core && ['any', 'personal'].includes(s.serviceType))).length) {
      return this.saved.emit([]);
    }

    this.servicesForm = this.fb.group({
      services: this.fb.array(this.bulidFormGroupControls())
    });

    (this.servicesForm.get('services') as FormArray).controls.forEach((g: FormGroup) => {
      const value = g.get('checked').value;
      if (value) { this.toggleDependencies(value, g); }
    });
  }

  selectService(serviceId: string) {
    this.selectedService = this.allServices.find(s => s._id === serviceId);
  }

  bulidFormGroupControls() {

    const groups = this.allServices.map(s => {
      const group = this.fb.group({
        _id: this.fb.control(s._id),
        value: this.fb.control(s.name),
        core: [s.core],
        checked: this.fb.control((this.enabledServices.includes(s._id) || s.core)),
        dependencies: this.fb.control(s.dependencies),
        image: [s.image]
      });

      group.get('checked').valueChanges.subscribe(value => {
        this.toggleDependencies(value, group);
      });
      return group;
    });
    return groups;
  }

  getDependencyNames(dependencies: string[]) {
    const serviceNames = dependencies.map((d) => {
      const service = this.allServices.find(s => s._id === d);
      return service.name;
    });
    return serviceNames;
  }

  get services(): FormArray {
    return this.servicesForm.get('services') as FormArray;
  }

  onSubmit() {

    const services = (this.servicesForm.value.services as Array<any>)
      .map(s => {
        return {
          enabled: s.checked as boolean,
          service: this.allServices.find(service => s._id === service._id)
        };
      }).filter(s => !s.service.core);
    this.saved.emit(services);
  }

  handleError(response: any) {
    try {
      response = JSON.parse(response);
      response = response.message;
    } catch (err) { }
     this.error = response;
  }

  private toggleDependencies(value: boolean, sourceGroup: FormGroup) {

  if (value) {
    const dependencies =  sourceGroup.get('dependencies').value as string[];
    dependencies.forEach(d => {
      const group = (this.servicesForm.get('services') as FormArray)
                    .controls.find(control => control.get('_id').value === d);
      group.get('checked').setValue(value);
     });
   } else {
      const id = sourceGroup.get('_id').value;
      const groups = (this.servicesForm.get('services') as FormArray)
                    .controls.filter(control => (control.get('dependencies').value as string[]).includes(id));

      groups.forEach(g => { g.get('checked').setValue(value); });
   }
  }

}
