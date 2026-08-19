import { Auditable } from "./audit";

export interface Corrector extends Auditable{
  name: string;
  model: string;
  serialNumber: string;
  downloadExtension: string;

}

export enum CorrectorExtension {
  XLS = 'XLS',
  CSV = 'CSV'
}

export const CorrectorExtensionLabel: Record<CorrectorExtension, string> = {
  [CorrectorExtension.XLS]: 'Excel',
  [CorrectorExtension.CSV]: 'CSV'
};

// Mapeamento das extensões de ficheiro reais
export const CorrectorExtensionValue: Record<CorrectorExtension, string> = {
  [CorrectorExtension.XLS]: '.xls',
  [CorrectorExtension.CSV]: '.csv'
};


export interface PagedCorrectors {
  _embedded?: {
    correctors: Corrector[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}


