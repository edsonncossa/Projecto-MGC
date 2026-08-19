// movement-type.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { MovementType } from '../models/stockMovement';

@Pipe({
  name: 'movementType',
  standalone: true
})
export class MovementTypePipe implements PipeTransform {
  transform(value: MovementType): string {
    const map: Record<MovementType, string> = {
      [MovementType.ENTRY]: 'Entrada',
      [MovementType.EXIT]: 'Saída'
    };
    return map[value] ?? value;
  }
}
