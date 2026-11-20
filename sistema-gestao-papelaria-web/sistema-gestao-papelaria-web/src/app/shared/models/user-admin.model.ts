import { AppModule } from './module.model';

export interface UserAdmin {
  id: number;
  username: string;
  fullName: string;
  enabled: boolean;
  admin: boolean;
  modules: AppModule[];
}

export interface UserCreateRequest {
  username: string;
  fullName: string;
  password: string;
  permissionIds: number[];
}

export interface UserUpdateRequest {
  fullName?: string;
  enabled?: boolean;
  permissionIds?: number[];
}