import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, catchError, switchMap, throwError, finalize } from 'rxjs';
import { AuthService } from '@app/services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  private isRefreshing = false;

  constructor(private auth: AuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const token = this.auth.getToken();

    // Identifica se a requisição é para login, registo ou refresh
    const isAuthEndpoint = req.url.includes('/auth/login') || 
                           req.url.includes('/auth/refresh') || 
                           req.url.includes('/auth/signin');

    let request = req;

    // Anexa o Bearer Token apenas em requisições protegidas
    if (token && token.trim() && !isAuthEndpoint) {
      request = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {

        // Trata apenas erro 401 Unauthorized e evita loops de refresh
        if (error.status === 401 && !this.isRefreshing && !isAuthEndpoint) {

          this.isRefreshing = true;

          return this.auth.refreshToken().pipe(
            switchMap(() => {
              const newToken = this.auth.getToken();

              if (!newToken) {
                this.auth.logout();
                return throwError(() => error);
              }

              const newRequest = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`
                }
              });

              return next.handle(newRequest);
            }),
            catchError(err => {
              this.auth.logout();
              return throwError(() => err);
            }),
            finalize(() => {
              this.isRefreshing = false;
            })
          );
        }

        return throwError(() => error);
      })
    );
  }
}