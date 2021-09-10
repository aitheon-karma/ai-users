import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'editDate'
})
export class EditDatePipe implements PipeTransform {
  transform(value: Date): string {
    const momentValue = moment(value).format( 'MM-DD-YYYY');
    if (momentValue === moment().format( 'MM-DD-YYYY')) {
      return 'today';
    } else if (momentValue === moment().subtract(1, 'days').format( 'MM-DD-YYYY')) {
      return 'yesterday';
    } else {
      return moment(value).format( 'MM-DD-YYYY').toString();
    }
  }

}
