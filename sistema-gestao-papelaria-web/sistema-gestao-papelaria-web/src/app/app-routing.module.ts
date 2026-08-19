import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module')
      .then(m => m.LoginModule)
  },

  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'dashboard',
  },
  {
    path: 'users',
    loadChildren: () =>
      import('./pages/users/users.module')
        .then(m => m.UsersModule)
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./pages/dashboard/dashboard.module')
        .then(m => m.DashboardModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'support',
    loadChildren: () =>
      import('./pages/support/support.module')
        .then(m => m.SupportModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'client',
    loadChildren: () => import('./pages/client/client.module')
      .then(m => m.ClientModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'product',
    loadChildren: () => import('./pages/product/product.module')
      .then(m => m.ProductModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'stock',
    loadChildren: () => import('./pages/stock/stock.module')
      .then(m => m.StockModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    loadChildren: () => import('./pages/settings/settings.module')
      .then(m => m.SettingsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'sales',
    loadChildren: () => import('./pages/sales/sales.module')
      .then(m => m.SalesModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'corrector',
    loadChildren: () => import('./pages/corrector/corrector.module')
      .then(m => m.CorrectorModule),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
