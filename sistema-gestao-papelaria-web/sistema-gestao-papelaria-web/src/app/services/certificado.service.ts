import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface CertificadoDashboardDTO {
  customerName: string;
  monthYear: string;
  totalVolumeM3: number;
  totalEnergyGj: number;
  dailyAvgM3: number;
  dailyAvgGj: number;
  energyContentMjSm3: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class CertificadoService {
  baseURL = `${environment.apiURL}api/certificados`;

  private http = inject(HttpClient);

  gerarCertificado(dados: CertificadoDashboardDTO): Observable<Blob> {
    return this.http.post(`${this.baseURL}/emitir`, dados, {
      responseType: 'blob'
    });
  }
}