import { Auditable } from "./audit";

export interface Consumption extends Auditable{
  consumptionDate: string;
  correctedVolume: number;
  fileImportId: number;
  clientId: number;
}


export interface PagedConsumptions {
  _embedded?: {
    Consumptions: Consumption[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}


