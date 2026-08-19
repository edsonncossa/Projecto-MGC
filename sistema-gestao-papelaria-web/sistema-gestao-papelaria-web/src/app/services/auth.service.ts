import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable,inject } from '@angular/core';
import { tap, EMPTY, Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { jwtDecode } from 'jwt-decode';
import { BehaviorSubject } from 'rxjs';
import { ChangePasswordDTO, TokenDTO, User } from '@app/shared/models/user';
import { Router } from '@angular/router';


interface ApiResponse<T> {
  body: T;
  headers: any;
  statusCode: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  baseURL = `${environment.apiURL}auth`;
  private router = inject(Router);

  private authStatus = new BehaviorSubject<boolean>(false);

  authStatus$ = this.authStatus.asObservable();

  constructor(private http: HttpClient) {

    setTimeout(() => {
      this.authStatus.next(this.hasValidToken());
    }, 0);

    window.addEventListener('storage', () => {
      this.authStatus.next(this.hasValidToken());
    });
  }

  private hasValidToken(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired();
  }

  //  LOGIN
  login(credentials: any) {
    return this.http.post<ApiResponse<TokenDTO>>(`${this.baseURL}/signin`, credentials)
      .pipe(
        tap(res => this.saveTokens(res.body))
      );
  }

  //  REFRESH TOKEN
  refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');
    const username = localStorage.getItem('username');

    if (!refreshToken || !username) {
      return EMPTY;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${refreshToken}`
    });

    return this.http.put<any>(
      `${this.baseURL}/refresh/${username}`,
      {},
      { headers }
    ).pipe(
      tap(res => {
        const data = res.body;
        this.saveTokens(data);
      })
    );
  }


  //  SALVAR TOKENS
  private saveTokens(data: TokenDTO) {
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('username', data.username);

    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    const decoded: any = jwtDecode(data.accessToken);
    localStorage.setItem('expiration', String(decoded.exp * 1000));

    this.authStatus.next(true);
  }

  //  TOKEN
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  //  EXPIRAÇÃO
  isTokenExpired(): boolean {
    const exp = localStorage.getItem('expiration');
    return !exp || new Date().getTime() > +exp;
  }

  //  ROLES
  getRoles(): string[] {
    const token = this.getToken();
    if (!token) return [];
    const decoded: any = jwtDecode(token);
    return decoded.roles || [];
  }

  hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  //  LOGOUT
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('username');
    localStorage.removeItem('expiration');
    localStorage.removeItem('user');
    sessionStorage.clear();
    this.authStatus.next(false);
    this.router.navigate(['/auth/login']);
  }

  //  AUTENTICADO
  isAuthenticated(): boolean {
    return !!this.getToken() && !this.isTokenExpired();
  }

  getUser(): User | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  // Alterar senha
  changePassword(dto: ChangePasswordDTO): Observable<ChangePasswordDTO> {
    return this.http.put<ChangePasswordDTO>(`${this.baseURL}/change-password`, dto);
  }

  updateImage(user: User): Observable<User> {
    return this.http.put<User>(this.baseURL, user);
  }
}
