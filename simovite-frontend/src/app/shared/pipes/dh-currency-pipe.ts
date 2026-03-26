import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dhCurrency',
  standalone: false,
})
export class DhCurrencyPipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
