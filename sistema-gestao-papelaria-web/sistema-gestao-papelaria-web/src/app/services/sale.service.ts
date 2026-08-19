import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Sale, SaleItem, SaleRequest } from "@app/shared/models/sale";
import { map, Observable, tap } from "rxjs";
import { environment } from "src/environments/environment";


interface HateoasResponse {
  _embedded: {
    sales?: Sale[];
    [key: string]: Sale[] | undefined;
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
export class SaleService {
  baseURL = `${environment.apiURL}api/sale/v1`;
  constructor(private http: HttpClient) { }

  findAll(
    page: number,
    size: number,
    direction: 'asc' | 'desc'
  ): Observable<Sale[]> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('direction', direction);

    return this.http.get<HateoasResponse>(this.baseURL, { params }).pipe(
      map(response => response._embedded?.sales || [])
    );
  }

  create(payload: SaleRequest): Observable<any> {
    return this.http.post<Sale>(this.baseURL, payload);
  }

  update(sale: Sale): Observable<Sale> {
    return this.http.put<Sale>(this.baseURL, sale);
  }

  findById(id: number): Observable<Sale> {
    return this.http.get<Sale>(`${this.baseURL}/${id}`);
  }

  disableSale(id: number): Observable<Sale> {
    return this.http.patch<Sale>(`${this.baseURL}/disableSale/${id}`, {});
  }

  countByCreatedDateBetweenAndSaleStatusAndStatus(): Observable<number> {
    return this.http.get<number>(`${this.baseURL}/countByCreatedDate`);
  }

  countSalesThisMonth(): Observable<number> {
    return this.http.get<number>(`${this.baseURL}/countByCreatedDate`);
  }

  getSalesWeek(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseURL}/find-sales-by-week`);
}
}




