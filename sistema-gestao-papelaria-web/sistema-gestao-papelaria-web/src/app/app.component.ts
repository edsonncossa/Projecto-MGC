import { Component, OnInit, AfterContentInit, OnDestroy, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { BehaviorSubject, catchError, combineLatest, filter, fromEvent, map, of, Subject, switchMap, takeUntil } from 'rxjs';
import { NbMenuItem, NbSidebarService,NbMenuService } from '@nebular/theme';
import { buildMenu } from './shared/models/menu';
import { ModuleService } from './services/module.service';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from './services/auth.service';
import { LoadingService } from './shared/services/loading.service';

export const SCROLL_CONTAINER = 'mat-sidenav-content';
export const TEXT_LIMIT = 50;
export const SHADOW_LIMIT = 100;

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, AfterContentInit, OnDestroy {
  public isSmallScreen = false;
  public popText = false;
  public applyShadow = false;
  public items_menu: NbMenuItem[] = [];
  public menuName = '';
  defaultAvatar = 'assets/perfil.png';

  private readonly profileItem: NbMenuItem = { title: 'Perfil', icon: 'person-outline', data: 'profile' };
  private readonly switchItem: NbMenuItem = { title: 'Trocar de módulo', icon: 'swap-outline', data: 'switch-module' };
  private readonly logoutItem: NbMenuItem = { title: 'Sair', icon: 'log-out-outline', data: 'logout' };
  public userMenu: NbMenuItem[] = [this.profileItem, this.logoutItem];

  // Injeções de Serviço
  private sidebarService = inject(NbSidebarService);
  private breakpointObserver = inject(BreakpointObserver);
  private route = inject(Router);
  public auth = inject(AuthService);
  private nbMenuService = inject(NbMenuService);
  private moduleService = inject(ModuleService);
  private url$ = new BehaviorSubject<string>('');

  center: google.maps.LatLngLiteral = { lat: -25.9653, lng: 32.5892 };
  zoom = 12;

  // Lista tradicional de marcadores
  markers = [
    { position: { lat: -25.9653, lng: 32.5892 }, title: 'Marcador 1' },
    { position: { lat: -25.9550, lng: 32.5950 }, title: 'Marcador 2' }
  ];

  alterarLocalizacao(): void {
    this.center = { lat: -25.9400, lng: 32.6100 };
    this.zoom = 14;
  }

  // Destruição de subscriptions
  private destroy$ = new Subject<void>();

  isLoggedIn$ = this.auth.authStatus$;

  /** O layout (header + menu) só aparece com sessão e fora do ecrã de escolha de módulo. */
  showLayout$ = combineLatest([this.isLoggedIn$, this.url$]).pipe(
    map(([logged, url]) => logged && !url.startsWith('/modulos'))
  );

  isLoading$ = this.loadingService.loading$;

  isSmallScreen$ = this.breakpointObserver
    .observe(['(max-width: 800px)'])
    .pipe(map(res => res.matches));

  sidenavMode$ = this.isSmallScreen$.pipe(
    map(v => v ? 'over' : 'side')
  );

  constructor(public loadingService: LoadingService) { }

  ngOnInit(): void {
    // Menu: recalculado no login/logout e sempre que o módulo activo muda.
    combineLatest([this.auth.authStatus$, this.moduleService.active$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([logged, module]) => {
        const roles = logged ? (this.auth.getRoles() || []) : [];
        this.items_menu = buildMenu(module?.code ?? null, roles);
        this.updateMenuName(this.url$.value);
      });

    // Menu do utilizador: "Trocar de módulo" só aparece com 2 ou mais módulos.
    this.auth.authStatus$
      .pipe(
        switchMap(logged => logged ? this.moduleService.list().pipe(catchError(() => of([]))) : of([])),
        takeUntil(this.destroy$)
      )
      .subscribe(list => {
        this.userMenu = list.length > 1
          ? [this.profileItem, this.switchItem, this.logoutItem]
          : [this.profileItem, this.logoutItem];
      });

    // Scroll listener
    const content = document.getElementsByClassName(SCROLL_CONTAINER)[0];
    if (content) {
      fromEvent(content, 'scroll')
        .pipe(
          map(() => (content as HTMLElement).scrollTop),
          takeUntil(this.destroy$)
        )
        .subscribe((value: number) => this.determineHeader(value));
    }

    // Router event listener
    this.route.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        map(event => event as NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.url$.next(event.urlAfterRedirects);
        this.updateMenuName(event.urlAfterRedirects);
      });

      this.nbMenuService.onItemClick()
      .pipe(
        filter(({ tag }) => tag === 'user-context-menu'),
        map(({ item }) => item.data),
        takeUntil(this.destroy$)
      )
      .subscribe((action) => {
        if (action === 'logout') {
          this.moduleService.clear();
          this.auth.logout();
          this.route.navigate(['/login']).then(() => {
            // Recarrega a página para limpar o estado em memória do Nebular/Angular
            window.location.reload();
          });
        } else if (action === 'profile') {
          this.route.navigate(['/users/myProfile']);
        } else if (action === 'switch-module') {
          this.route.navigate(['/modulos']);
        }
      });
  }

  private updateMenuName(url: string): void {
    const base = '/' + (url.split('?')[0].split('/')[1] ?? '');
    const menuItem = this.items_menu.find((item: NbMenuItem) => item.link === base);
    this.menuName = menuItem?.title ?? this.moduleService.current()?.name ?? '';
  }

  toggleSidebar(): boolean {
    this.sidebarService.toggle(true, 'sidebar');
    return false;
  }

  

  determineHeader(scrollTop: number): void {
    this.popText = scrollTop >= TEXT_LIMIT;
    this.applyShadow = scrollTop >= SHADOW_LIMIT;
  }

  ngAfterContentInit(): void {
    this.breakpointObserver
      .observe(['(max-width: 800px)'])
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => (this.isSmallScreen = res.matches));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get sidenavMode(): 'over' | 'side' {
    return this.isSmallScreen ? 'over' : 'side';
  }

  getImage(userImage: string | null | undefined): string {
    return userImage && userImage.trim() !== '' ? userImage : this.defaultAvatar;
  }
}