import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({
  name: 'capitalizeDate',
})
export class CapitalizeDatePipe implements PipeTransform {

  transform(value: string | null ): string {

    if( !value ) return '';

    return value.replace(/\b[a-z]/, match => match.toUpperCase())
                .replace('p. m.', 'PM')
                .replace('a. m.', 'AM')
  }

}
