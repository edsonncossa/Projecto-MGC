import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from '@app/services/auth.service';
import { ModuleService } from '@app/services/module.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(
    private modules: ModuleService,
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean | UrlTree> {
    if (!this.auth.isAuthenticated()) return of(false);

    return this.modules.me().pipe(
      map(me => me.admin ? true : this.router.createUrlTree(['/modulos'])),
      catchError(err => {
        if (err?.status === 401) { this.auth.logout(); return of(false); }
        return of(this.router.createUrlTree(['/modulos']));
      })
    );
  }
}