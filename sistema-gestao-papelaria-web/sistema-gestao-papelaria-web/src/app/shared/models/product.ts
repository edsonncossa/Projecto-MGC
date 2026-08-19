import { Auditable } from "./audit";
import { Stock } from './stock';

export interface Category extends Auditable {
  name: string,
  description: string;
}

export interface Unit extends Auditable {
  name: string,
  symbol: string,
  description: string
}

export interface Product extends Auditable {
  name: string,
  description: string,
  unitPrice: number,
  categoryId: number;
  category?: Category,
  reference?: string,
  stock?:Stock,
  image?:string
}

export interface ProductUnitConversion extends Auditable {
  productId: number;
  product?: Product;
  unitId: number;
  unit?: Unit;
  conversionFactor: number;
}


export interface PagedProducts {
  _embedded?: {
    products: Product[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

