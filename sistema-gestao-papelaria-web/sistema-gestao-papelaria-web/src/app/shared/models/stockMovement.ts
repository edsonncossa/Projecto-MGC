import { Product } from '@app/shared/models/product';
import { Auditable } from './audit';
import { Stock } from './stock';

export enum MovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT'
}

export const MovementTypeLabel: { [key in MovementType]: string } = {
  [MovementType.ENTRY]: 'Entrada',
  [MovementType.EXIT]: 'Saída'
};

export interface StockMovement extends Auditable{
  stock?: Stock;
  stockId: number;
  quantity: number;
  type: MovementType;
}

export interface PagedStockMovement {
  _embedded?: {
    StockMovement: StockMovement[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
  _links?: any;
}
