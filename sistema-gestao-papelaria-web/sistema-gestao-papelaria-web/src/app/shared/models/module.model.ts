export interface AppModule {
  id: number;
  code: string;          // MODULE_CONSUMPTION
  name: string;          // Módulo de Consumos
  route: string;         // /dashboard
  icon: string | null;   // bar_chart | tune | ...
}

export interface Me {
  username: string;
  fullName: string;
  admin: boolean;
}