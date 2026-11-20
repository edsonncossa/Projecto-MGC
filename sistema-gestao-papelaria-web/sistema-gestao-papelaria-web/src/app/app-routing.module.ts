import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { ModuleGuard } from './guards/module.guard';
import { MODULE_CODES } from './shared/models/module-codes';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./pages/login/login.module')
      .then(m => m.LoginModule)
  },
  {
    path: 'modulos',
    loadChildren: () => import('./pages/module-select/module-select.module')
      .then(m => m.ModuleSelectModule),
    canActivate: [AuthGuard]
  },
  {
    // Depois do login o utilizador escolhe sempre (ou entra direto, se só tiver um módulo).
    path: '',
    pathMatch: 'full',
    redirectTo: 'modulos',
  },

  // ── Rotas partilhadas por todos os módulos (só exigem sessão) ──
  {
    path: 'users',
    loadChildren: () => import('./pages/users/users.module')
      .then(m => m.UsersModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'settings',
    loadChildren: () => import('./pages/settings/settings.module')
      .then(m => m.SettingsModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'support',
    loadChildren: () => import('./pages/support/support.module')
      .then(m => m.SupportModule),
    canActivate: [AuthGuard]
  },

  // ── Módulo de Consumos ──
  {
    path: 'dashboard',
    loadChildren: () => import('./pages/dashboard/dashboard.module')
      .then(m => m.DashboardModule),
    canActivate: [AuthGuard, ModuleGuard],
    data: { module: MODULE_CODES.CONSUMPTION }
  },
  {
  path: 'simulacao',
  loadChildren: () => import('./pages/simulacao/simulacao.module').then(m => m.SimulacaoModule),
  canActivate: [AuthGuard, ModuleGuard],
  data: { module: 'MODULE_SIMULATION' }
},
  {
    path: 'client',
    loadChildren: () => import('./pages/client/client.module')
      .then(m => m.ClientModule),
    canActivate: [AuthGuard, ModuleGuard],
    data: { module: MODULE_CODES.CONSUMPTION }
  },
  {
    path: 'sales',
    loadChildren: () => import('./pages/sales/sales.module')
      .then(m => m.SalesModule),
    canActivate: [AuthGuard, ModuleGuard],
    data: { module: MODULE_CODES.CONSUMPTION }
  },
  {
    path: 'maps',
    loadChildren: () => import('./pages/maps/maps.module')
      .then(m => m.MapsModule),
    canActivate: [AuthGuard, ModuleGuard],
    data: { module: MODULE_CODES.CONSUMPTION }
  },

  // ── A associar ao respectivo módulo (por agora só exige sessão) ──
  {
    path: 'corrector',
    loadChildren: () => import('./pages/corrector/corrector.module')
      .then(m => m.CorrectorModule),
    canActivate: [AuthGuard]
  },

  { path: '**', redirectTo: 'modulos' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
