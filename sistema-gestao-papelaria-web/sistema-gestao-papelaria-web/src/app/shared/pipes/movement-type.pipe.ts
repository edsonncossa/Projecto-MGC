// movement-type.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { MovementType } from '../models/stockMovement';

@Pipe({
  name: 'movementType'
})
export class MovementTypePipe implements PipeTransform {
  transform(value: MovementType): string {
    const labels: Record<MovementType, string> = {
      [MovementType.ENTRY]: 'Entrada',
      [MovementType.EXIT]: 'Saída'
    };
    return labels[value] ?? value;
  }
}
