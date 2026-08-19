import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Category } from "@app/shared/models/product";
import { PagedStockMovement, StockMovement } from "@app/shared/models/stockMovement";
import { map, Observable } from "rxjs";
import { environment } from "src/environments/environment";

export interface PagedResponse<T> {
  _embedded: {
    stockMovementDTOList: T[];
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class StockMovementService {
  baseURL = `${environment.apiURL}api/stockMovement/v1`;
  constructor(private http: HttpClient) {}

  findAll(
    page: number,
    size: number,
    sortProperty: string = 'product.name',
    direction: 'asc' | 'desc' = 'asc'
  ): Observable<StockMovement[]> {

    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', sortProperty)
      .set('direction', direction);

    return this.http
      .get<PagedStockMovement>(this.baseURL, { params })
      .pipe(
        map(res => {
          return res._embedded?.StockMovement ?? [];
        })
      );
  }

  findByProductIdAndStatus(
    productId: number,
    page: number,
    size: number,
    sortBy: string = 'createdDate',
    direction: 'asc' | 'desc' = 'asc'
  ): Observable<StockMovement[]> {

    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('direction', direction);

    const url = `${this.baseURL}/product/${productId}`;

    return this.http
      .get<PagedStockMovement>(url, { params })
      .pipe(
        map(res => {
          return res._embedded?.StockMovement ?? [];
        })
      );
  }

  create(stockMovement: StockMovement): Observable<StockMovement> {
    return this.http.post<StockMovement>(this.baseURL, stockMovement);
  }

  update(stockMovement: StockMovement): Observable<StockMovement> {
    return this.http.put<StockMovement>(this.baseURL, stockMovement);
  }

  findById(id: number): Observable<StockMovement> {
    return this.http.get<StockMovement>(`${this.baseURL}/${id}`);
  }

  disableCategory(id: number): Observable<StockMovement> {
    return this.http.patch<StockMovement>(`${this.baseURL}/disableStockMovement/${id}`, {});
  }

}




