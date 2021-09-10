import { Component, Input, Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[flFileIcon]'
})
export class FileIconDirective {

  constructor(private el: ElementRef) { }

  @Input('flFileIcon') set fileIcon(mimetype: string) {
    let className = ' fa-file-o';
    if (mimetype.includes('image')) {
      className = ' fa-file-image-o';
    } else if (mimetype.includes('pdf')) {
      className = ' fa-file-pdf-o text-danger';
    } else if (mimetype.includes('wordprocessingml')) {
      className = ' fa-file-word-o text-primary';
    } else if (mimetype.includes('spreadsheetml')) {
      className = ' fa fa-file-excel-o text-success';
    }

    this.el.nativeElement.className += className;
  }
}
