import { Auditable } from "./audit";

export interface Client extends Auditable{
  firstName: string;
  phoneNumber: string;
  address: string;
  email: string;
  type: ClientType;
}

export enum ClientType {
  COMPANY = 'COMPANY'
}

export const ClientTypeLabel: Record<ClientType, string> = {
  [ClientType.COMPANY]: 'Empresa'
};

export interface PagedClients {
  _embedded?: {
    clients: Client[];
  };
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}


