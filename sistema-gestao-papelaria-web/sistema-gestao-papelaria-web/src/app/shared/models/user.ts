import { Auditable } from "./audit";

export interface TokenDTO {
  username: string;
  authenticated: boolean;
  accessToken: string;
  refreshToken: string;
  user: User;
}


export interface User extends Auditable {
  userName: string;
  fullName: string;
  image: string;
}

export interface ChangePasswordDTO {
  username: string;
  oldPassword: string;
  newPassword: string;
}
