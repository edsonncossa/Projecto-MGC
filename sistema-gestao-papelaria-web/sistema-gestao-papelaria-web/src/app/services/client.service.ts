import { HttpClient, HttpParams, HttpResponse } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Client } from "@app/shared/models/client";
import { Observable } from "rxjs";
import { environment } from "src/environments/environment";
7


@Injectable({
  providedIn: 'root'
})
export class ClientService {
  baseURL = `${environment.apiURL}api/client/v1`;
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

  create(client: Client): Observable<Client> {
    return this.http.post<Client>(this.baseURL, client);
  }

  update(client: Client): Observable<Client> {
    return this.http.put<Client>(this.baseURL, client);
  }

  findById(id: number): Observable<Client> {
    return this.http.get<Client>(`${this.baseURL}/${id}`);
  }

  disableClient(id: number): Observable<Client> {
    return this.http.patch<Client>(`${this.baseURL}/disableClient/${id}`, {});
  }

  countClients(): Observable<number> {
    return this.http.get<number>(`${this.baseURL}/countClients`);
  }

}




