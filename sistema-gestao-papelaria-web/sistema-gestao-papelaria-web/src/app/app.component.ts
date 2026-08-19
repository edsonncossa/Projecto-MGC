import { Component, OnInit, AfterContentInit, OnDestroy, inject } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';
import { filter, fromEvent, map, Subject, takeUntil } from 'rxjs';
import { NbMenuItem, NbSidebarService,NbMenuService } from '@nebular/theme';
import { MENU_ITEMS } from './shared/models/menu';
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
  public items_menu: NbMenuItem[] = MENU_ITEMS;
  public menuName = '';
  defaultAvatar = 'assets/perfil.png';
  public userMenu: NbMenuItem[] = [
    { title: 'Perfil', icon: 'person-outline', data: 'profile' },
    { title: 'Sair', icon: 'log-out-outline', data: 'logout' },
  ];

  // Injeções de Serviço
  private sidebarService = inject(NbSidebarService);
  private breakpointObserver = inject(BreakpointObserver);
  private route = inject(Router);
  public auth = inject(AuthService);
  private nbMenuService = inject(NbMenuService);

  // Destruição de subscriptions
  private destroy$ = new Subject<void>();

  isLoggedIn$ = this.auth.authStatus$;
  isLoading$ = this.loadingService.loading$;

  isSmallScreen$ = this.breakpointObserver
    .observe(['(max-width: 800px)'])
    .pipe(map(res => res.matches));

  sidenavMode$ = this.isSmallScreen$.pipe(
    map(v => v ? 'over' : 'side')
  );

  constructor(public loadingService: LoadingService) { }

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      const userRoles = this.auth.getRoles();

      this.items_menu = MENU_ITEMS.filter((item: any) =>
        !item.roles || item.roles.some((role: string) => userRoles.includes(role))
      );
    }

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
        const moduleName = event.url.split('/')[1];

        const menuItem = this.items_menu.find(
          (item: NbMenuItem) => item.link === `/${moduleName}`
        );

        this.menuName = menuItem?.title ?? 'Dashboard';
      });

      this.nbMenuService.onItemClick()
      .pipe(
        filter(({ tag }) => tag === 'user-context-menu'),
        map(({ item }) => item.data),
        takeUntil(this.destroy$)
      )
      .subscribe((action) => {
        if (action === 'logout') {
          this.auth.logout();
          this.route.navigate(['/auth/login']).then(() => {
        // 2. Recarrega a página para limpar o estado em memória do Nebular/Angular
        window.location.reload();});
        } else if (action === 'profile') {
          this.route.navigate(['/users/myProfile']);
        }
      });
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