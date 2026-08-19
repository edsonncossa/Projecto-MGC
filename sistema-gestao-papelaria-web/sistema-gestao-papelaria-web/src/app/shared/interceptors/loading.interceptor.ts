import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {

  // URLs que NÃO devem mostrar o spinner (opcional)
  private excludeUrls: string[] = [
    '/auth/signin',
    '/auth/refresh'
  ];

  constructor(private loadingService: LoadingService) { }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    // Verifica se a URL deve ser ignorada
    const shouldIgnore = this.excludeUrls.some(url => req.url.includes(url));

    if (!shouldIgnore) {
      this.loadingService.show();
    }

    return next.handle(req).pipe(
      finalize(() => {
        if (!shouldIgnore) {
          this.loadingService.hide();
        }
      })
    );
  }
}
