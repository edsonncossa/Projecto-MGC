import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Stock } from "@app/shared/models/stock";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: 'root'
})
export class StockService {
  baseURL = `${environment.apiURL}api/stock/v1`;
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

  create(stock: Stock): Observable<Stock> {
    return this.http.post<Stock>(this.baseURL, stock);
  }

  update(stock: Stock): Observable<Stock> {
    return this.http.put<Stock>(this.baseURL, stock);
  }

  findById(id: number): Observable<Stock> {
    return this.http.get<Stock>(`${this.baseURL}/${id}`);
  }

  findByProductId(id: number): Observable<Stock> {
    return this.http.get<Stock>(`${this.baseURL}/findByProductId/${id}`);
  }

  disableStock(id: number): Observable<Stock> {
    return this.http.patch<Stock>(`${this.baseURL}/disableStock/${id}`, {});
  }

}




