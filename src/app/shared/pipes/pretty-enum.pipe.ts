import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'prettyEnum'
})
export class PrettyEnumPipe implements PipeTransform {
  private terms = ['WEB', 'HTTP', 'REST', 'API', 'AI'];
  transform(value: string): string {
    const words: string[] = (value || '').split('_').map(word => {
      if (this.terms.indexOf(word) !== -1) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    });

    return words.join(' ');
  }

}
