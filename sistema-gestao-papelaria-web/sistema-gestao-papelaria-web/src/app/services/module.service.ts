import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, shareReplay, tap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { AppModule, Me } from '@app/shared/models/module.model';
import { AuthService } from '@app/services/auth.service';

@Injectable({ providedIn: 'root' })
export class ModuleService {
  private readonly KEY = 'selectedModule';
  private readonly base = `${environment.apiURL}auth`;
  private modules$?: Observable<AppModule[]>;
  private me$?: Observable<Me>;

  /** Módulo activo como stream, para o menu reagir às mudanças. */
  private readonly activeSubject = new BehaviorSubject<AppModule | null>(this.read());
  readonly active$ = this.activeSubject.asObservable();

  constructor(private http: HttpClient, private router: Router, auth: AuthService) {
    // Sessão terminada (logout, 401, outro separador): esquece as listas em cache.
    // O sessionStorage já é limpo pelo AuthService.logout().
    auth.authStatus$.pipe(filter(ok => !ok)).subscribe(() => {
      this.invalidate();
      this.activeSubject.next(this.read());
    });
  }

  /** Módulos do utilizador autenticado (em cache; force=true volta a pedir ao servidor). */
  list(force = false): Observable<AppModule[]> {
    if (force || !this.modules$) {
      this.modules$ = this.http.get<AppModule[]>(`${this.base}/modules`).pipe(
        tap({ error: () => (this.modules$ = undefined) }),
        shareReplay(1)
      );
    }
    return this.modules$;
  }

  /** Quem sou e se sou administrador. */
  me(force = false): Observable<Me> {
    if (force || !this.me$) {
      this.me$ = this.http.get<Me>(`${this.base}/me`).pipe(
        tap({ error: () => (this.me$ = undefined) }),
        shareReplay(1)
      );
    }
    return this.me$;
  }

  /** Guarda o módulo ativo, sem navegar. */
  remember(m: AppModule): void {
    try { sessionStorage.setItem(this.KEY, JSON.stringify(m)); } catch { /* modo privado */ }
    this.activeSubject.next(m);
  }

  /** Escolhe o módulo e entra nele. */
  select(m: AppModule): void {
    this.remember(m);
    this.router.navigateByUrl(m.route);
  }

  current(): AppModule | null {
    return this.activeSubject.value;
  }

  /** Esquece as listas em cache (depois de editar permissões). */
  invalidate(): void {
    this.modules$ = undefined;
    this.me$ = undefined;
  }

  /** Esquece tudo, incluindo o módulo escolhido. Chamado antes de cada login. */
  clear(): void {
    this.invalidate();
    try { sessionStorage.removeItem(this.KEY); } catch { /* ignorar */ }
    this.activeSubject.next(null);
  }

  private read(): AppModule | null {
    try {
      const v = sessionStorage.getItem(this.KEY);
      return v ? (JSON.parse(v) as AppModule) : null;
    } catch {
      return null;
    }
  }
}
