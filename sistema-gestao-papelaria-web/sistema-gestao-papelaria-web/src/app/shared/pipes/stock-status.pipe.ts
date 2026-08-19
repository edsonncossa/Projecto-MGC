// app/shared/pipes/stock-status.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'stockStatus' })
export class StockStatusPipe implements PipeTransform {
  transform(inputs: number | null, outputs: number | null): { value: number; class: string } {
    const quantity = (inputs ?? 0);
    return {
      value: quantity,
      class: quantity === 0 ? 'text-zero' : 'text-positive'
    };
  }
}
