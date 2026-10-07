import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Consumption } from '@app/shared/models/consumption';

@Injectable({
  providedIn: 'root'
})
export class ConsumptionService {
  private baseURL = `${environment.apiURL}api/consumption/v1`;

  constructor(private http: HttpClient) {}

  filterConsumptions(page: number, size: number, sortField: string, direction: string, filterParams: any): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sortField', sortField)
      .set('direction', direction);

    if (filterParams.clientIds && Array.isArray(filterParams.clientIds) && filterParams.clientIds.length > 0) {
      params = params.set('clientIds', filterParams.clientIds.join(','));
    }
    if (filterParams.startDate) {
      params = params.set('startDate', filterParams.startDate);
    }
    if (filterParams.endDate) {
      params = params.set('endDate', filterParams.endDate);
    }

    return this.http.get<any>(this.baseURL, { params });
  }

  compareConsumptions(filterParams: any): Observable<any> {
    let params = new HttpParams()
      .set('startDate1', filterParams.startDate1)
      .set('endDate1', filterParams.endDate1)
      .set('startDate2', filterParams.startDate2)
      .set('endDate2', filterParams.endDate2);

    if (filterParams.clientIds && Array.isArray(filterParams.clientIds) && filterParams.clientIds.length > 0) {
      params = params.set('clientIds', filterParams.clientIds.join(','));
    }

    return this.http.get<any>(`${this.baseURL}/compare`, { params });
  }

  findById(id: number): Observable<Consumption> {
    return this.http.get<Consumption>(`${this.baseURL}/${id}`);
  }

  create(consumption: Consumption): Observable<Consumption> {
    return this.http.post<Consumption>(this.baseURL, consumption);
  }

  update(consumption: Consumption): Observable<Consumption> {
    return this.http.put<Consumption>(this.baseURL, consumption);
  }

  disableConsumption(id: number): Observable<Consumption> {
    return this.http.patch<Consumption>(`${this.baseURL}/disableConsumption/${id}`, {});
  }

  countConsumptions(): Observable<number> {
    return this.http.get<number>(`${this.baseURL}/countConsumptions`);
  }
}