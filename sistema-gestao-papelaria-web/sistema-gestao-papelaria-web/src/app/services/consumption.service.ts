import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Consumption } from '@app/shared/models/consumption'; // Ajusta o caminho do teu model

@Injectable({
  providedIn: 'root'
})
export class ConsumptionService {
  private baseURL = `${environment.apiURL}api/consumption/v1`;

  constructor(private http: HttpClient) {}

  /**
   * Procura consumos com paginação, ordenação e filtros dinâmicos
   */
filterConsumptions(page: number, size: number, sortField: string, direction: string, filterParams: any): Observable<any> {
  let params = new HttpParams()
    .set('page', page.toString())
    .set('size', size.toString())
    .set('sortField', sortField)
    .set('direction', direction);

  if (filterParams.clientId !== null && filterParams.clientId !== undefined) {
    params = params.set('clientId', filterParams.clientId.toString());
  }
  if (filterParams.startDate) {
    params = params.set('startDate', filterParams.startDate);
  }
  if (filterParams.endDate) {
    params = params.set('endDate', filterParams.endDate);
  }

  return this.http.get<any>(this.baseURL, { params });
}

  /**
   * Procura consumo por ID
   */
  findById(id: number): Observable<Consumption> {
    return this.http.get<Consumption>(`${this.baseURL}/${id}`);
  }

  /**
   * Regista um novo consumo
   */
  create(consumption: Consumption): Observable<Consumption> {
    return this.http.post<Consumption>(this.baseURL, consumption);
  }

  /**
   * Atualiza um consumo existente
   */
  update(consumption: Consumption): Observable<Consumption> {
    return this.http.put<Consumption>(this.baseURL, consumption);
  }

  /**
   * Desativa (Soft Delete) um consumo
   */
  disableConsumption(id: number): Observable<Consumption> {
    return this.http.patch<Consumption>(`${this.baseURL}/disableConsumption/${id}`, {});
  }

  /**
   * Conta o número total de consumos ativos
   */
  countConsumptions(): Observable<number> {
    return this.http.get<number>(`${this.baseURL}/countConsumptions`);
  }
}