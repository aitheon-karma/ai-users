import { Service } from './service';
import { Component, Input, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[flServiceName]'
})
export class ServiceNameDirective {

  @Input() services: Array<Service>;

  constructor(private el: ElementRef) { }

  @Input('flServiceName') set setName(serviceId: string) {
    const service = this.services?.find((s: Service) => s._id === serviceId);
    this.el.nativeElement.innerHTML = service ? service.name : '';
  }
}
