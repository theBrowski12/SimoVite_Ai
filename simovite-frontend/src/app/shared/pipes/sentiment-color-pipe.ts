import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'sentimentColor',
  standalone: false,
})
export class SentimentColorPipe implements PipeTransform {
  transform(value: unknown, ...args: unknown[]): unknown {
    return null;
  }
}
