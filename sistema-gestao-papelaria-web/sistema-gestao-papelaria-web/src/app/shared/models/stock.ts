import { Auditable } from "./audit";
import { Product } from "./product";

export interface Stock extends Auditable {
  productId: number;
  product?: Product;
  quantity: number;
}
export interface PagedStocks {
  _embedded?: {
    stocks: Stock[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}
