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
export class SaleItemService {
  baseURL = `${environment.apiURL}api/saleItem/v1`;
  constructor(private http: HttpClient) { }

  getTopProducts(): Observable<any[]> {
  return this.http.get<any[]>(`${this.baseURL}/get-top-products`);
}
}




