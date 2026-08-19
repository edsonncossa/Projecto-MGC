import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Unit } from "@app/shared/models/product";
import { map, Observable } from "rxjs";
import { environment } from "src/environments/environment";


interface HateoasResponse {
  _embedded?: {
    Unit?: Unit[];
    [key: string]: Unit[] | undefined;
  };
  page?: {
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
  };
}


@Injectable({
  providedIn: 'root'
})
export class unitService {
  baseURL = `${environment.apiURL}api/unit/v1`;
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

  create(unit: Unit): Observable<Unit> {
    return this.http.post<Unit>(this.baseURL, unit);
  }

  update(unit: Unit): Observable<Unit> {
    return this.http.put<Unit>(this.baseURL, unit);
  }

  findById(id: number): Observable<Unit> {
    return this.http.get<Unit>(`${this.baseURL}/${id}`);
  }

  disableUnit(id: number): Observable<Unit> {
    return this.http.patch<Unit>(`${this.baseURL}/disableUnit/${id}`, {});
  }

}




