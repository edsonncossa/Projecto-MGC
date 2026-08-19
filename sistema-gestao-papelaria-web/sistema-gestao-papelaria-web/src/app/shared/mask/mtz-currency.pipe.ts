import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mtzCurrency',
  standalone: true  // ← Se usar standalone components
})
export class MtzCurrencyPipe implements PipeTransform {
  transform(value: number | string, showSymbol: boolean = true): string {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;

    if (numValue == null || isNaN(numValue)) {
      return showSymbol ? '0,00 MT' : '0,00';
    }

    const formatted = numValue.toLocaleString('pt-MZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });

    return `${formatted} MT`;
  }
}
