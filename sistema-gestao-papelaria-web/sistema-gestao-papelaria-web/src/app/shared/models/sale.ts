import { Auditable } from "./audit";
import { Client } from "./client";
import { Product, ProductUnitConversion, Unit } from "./product";

export enum SaleStatus {
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export interface Sale extends Auditable {
  clientId?: number;
  client?: Client
  totalValue: number;
  saleStatus: SaleStatus;
}

export interface SaleItem extends Auditable {
  saleId?: number;
  sale?: Sale;
  productId: number;
  product:Product;
  quantity: number;
  productUnitConversion?: ProductUnitConversion;
  productUnitConversionId?: number,
  subTotal?: number;
}

export interface PagedSales {
  _embedded?: {
    sales: Sale[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface PagedSaleItems {
  _embedded?: {
    saleItems: SaleItem[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

export interface SaleRequest {
  sale: Sale;
  items: SaleItem[];
}
