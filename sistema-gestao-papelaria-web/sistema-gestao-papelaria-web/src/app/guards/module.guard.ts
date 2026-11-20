import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ModuleService } from '@app/services/module.service';

/**
 * Protege rotas de um módulo.
 *
 * Uso no routing:  data: { module: MODULE_CODES.CONSUMPTION }
 *
 * - Sem `data.module` a rota é livre (ex.: definições, suporte).
 * - Se o utilizador não tem o módulo atribuído, vai para /modulos.
 * - Se tem, o módulo passa a ser o activo (cobre entrada por URL directo e refresh).
 */
@Injectable({ providedIn: 'root' })
export class ModuleGuard implements CanActivate {
  constructor(private modules: ModuleService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Observable<boolean | UrlTree> {
    const required: string | undefined = route.data?.['module'];
    if (!required) return of(true);

    return this.modules.list().pipe(
      map(list => {
        const match = list.find(m => m.code === required);
        if (!match) return this.router.createUrlTree(['/modulos']);

        if (this.modules.current()?.code !== match.code) {
          this.modules.remember(match);
        }
        return true;
      }),
      catchError(() => of(this.router.createUrlTree(['/modulos'])))
    );
  }
}
