import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { AppModule } from '@app/shared/models/module.model';
import { UserAdmin, UserCreateRequest, UserUpdateRequest } from '@app/shared/models/user-admin.model';

@Injectable({ providedIn: 'root' })
export class UserAdminService {
  private readonly base = `${environment.apiURL}auth`;

  constructor(private http: HttpClient) {}

  list(): Observable<UserAdmin[]> {
    return this.http.get<UserAdmin[]>(`${this.base}/users`);
  }

  get(id: number): Observable<UserAdmin> {
    return this.http.get<UserAdmin>(`${this.base}/users/${id}`);
  }

  create(req: UserCreateRequest): Observable<UserAdmin> {
    return this.http.post<UserAdmin>(`${this.base}/users`, req);
  }

  update(id: number, req: UserUpdateRequest): Observable<UserAdmin> {
    return this.http.put<UserAdmin>(`${this.base}/users/${id}`, req);
  }

  /** Todos os módulos ativos, para os checkboxes do formulário. */
  allModules(): Observable<AppModule[]> {
    return this.http.get<AppModule[]>(`${this.base}/modules/all`);
  }
}