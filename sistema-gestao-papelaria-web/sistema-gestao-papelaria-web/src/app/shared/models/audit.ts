export interface Base {
  id?: number;
}

export enum Status {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

export interface StatusDTO extends Base {
  status?: Status;
}

export interface Auditable extends StatusDTO {
  createdDate?: string;
  updatedDate?: string;
}


