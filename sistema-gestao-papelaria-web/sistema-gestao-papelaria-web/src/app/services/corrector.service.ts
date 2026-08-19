import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Corrector } from "@app/shared/models/corrector";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";



@Injectable({
  providedIn: 'root'
})
export class CorrectorService {
  baseURL = `${environment.apiURL}api/corrector/v1`;
  constructor(private http: HttpClient) { }

  get(
    page: number,
    size: number,
    search: string,
    direction?: string
  ): Observable<HttpResponse<any>> {

    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (direction) {
      params = params.set('direction', direction);
    }

    return this.http.get<any>(
      `${this.baseURL}/${search}`,
      { params, observe: 'response' }
    );
  }

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

  create(corrector: Corrector): Observable<Corrector> {
    return this.http.post<Corrector>(this.baseURL, corrector);
  }

  update(corrector: Corrector): Observable<Corrector> {
    return this.http.put<Corrector>(this.baseURL, corrector);
  }

  findById(id: number): Observable<Corrector> {
    return this.http.get<Corrector>(`${this.baseURL}/${id}`);
  }

  disableCorrector(id: number): Observable<Corrector> {
    return this.http.patch<Corrector>(`${this.baseURL}/disableCorrector/${id}`, {});
  }

  countCorrectors(): Observable<number> {
    return this.http.get<number>(`${this.baseURL}/countCorrectors`);
  }

}




