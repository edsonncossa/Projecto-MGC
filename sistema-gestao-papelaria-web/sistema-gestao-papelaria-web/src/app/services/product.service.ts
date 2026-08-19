import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Product } from "@app/shared/models/product";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  baseURL = `${environment.apiURL}api/product/v1`;
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

  findProductsWithoutStock(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseURL}/findProductsWithoutStock`);
  }

  findProductsWithStock(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseURL}/findProductsWithStock`);
  }

  findAllProductsWithConversionByStatus(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.baseURL}/findAllProductsWithConversionByStatus`);
  }

  create(product: Product): Observable<Product> {
    return this.http.post<Product>(this.baseURL, product);
  }

  update(product: Product): Observable<Product> {
    return this.http.put<Product>(this.baseURL, product);
  }

  findById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.baseURL}/${id}`);
  }

  disableProduct(id: number): Observable<Product> {
    return this.http.patch<Product>(`${this.baseURL}/disableProduct/${id}`, {});
  }

  countProducts(): Observable<number> {
    return this.http.get<number>(`${this.baseURL}/countProducts`);
  }

}




