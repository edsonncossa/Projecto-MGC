import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { ProductUnitConversion } from "@app/shared/models/product";
import { map, Observable } from "rxjs";
import { environment } from "src/environments/environment";


interface HateoasResponse {
  _embedded: {
    productUnitConversion?: ProductUnitConversion[];
    [key: string]: ProductUnitConversion[] | undefined;
  };
  page: {
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}


@Injectable({
  providedIn: 'root'
})
export class ProductUnitConversionService {
  baseURL = `${environment.apiURL}api/product-unit-conversion/v1`;
  constructor(private http: HttpClient) {}

  findAll(
    page: number,
    size: number,
    sortField: string,
    direction: 'asc' | 'desc',
    filter: string = ''
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortField', sortField)
      .set('direction', direction);

    if (filter) {
      params = params.set('search', filter);
    }

    return this.http.get<any>(this.baseURL, { params });
  }

  create(productUnitConversion: ProductUnitConversion): Observable<ProductUnitConversion> {
    return this.http.post<ProductUnitConversion>(this.baseURL, productUnitConversion);
  }

  update(productUnitConversion: ProductUnitConversion): Observable<ProductUnitConversion> {
    return this.http.put<ProductUnitConversion>(this.baseURL, productUnitConversion);
  }

  findById(id: number): Observable<ProductUnitConversion> {
    return this.http.get<ProductUnitConversion>(`${this.baseURL}/${id}`);
  }

  findByProductId(id: number): Observable<ProductUnitConversion[]> {
    return this.http.get<ProductUnitConversion[]>(`${this.baseURL}/findByProductId/${id}`);
  }

  disableProductUnitConversion(id: number): Observable<ProductUnitConversion> {
    return this.http.patch<ProductUnitConversion>(`${this.baseURL}/disableProductUnitConversion/${id}`, {});
  }

}




