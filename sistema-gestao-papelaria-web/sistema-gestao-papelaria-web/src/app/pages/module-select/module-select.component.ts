import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppModule } from '@app/shared/models/module.model';
import { ModuleService } from '@app/services/module.service';
import { AuthService } from '@app/services/auth.service';

@Component({
  selector: 'app-module-select',
  templateUrl: './module-select.component.html',
  styleUrls: ['./module-select.component.scss']
})
export class ModuleSelectComponent implements OnInit {
  modules: AppModule[] = [];
  loading = true;
  failed = false;
  year = new Date().getFullYear();

  constructor(
    private moduleService: ModuleService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.moduleService.list().subscribe({
      next: list => {
        this.modules = list;
        this.loading = false;
        if (list.length === 1) this.open(list[0]);   // só um módulo: entra direto
      },
      error: (err) => { console.error('Falha ao carregar módulos', err); this.loading = false; this.failed = true; }
    });
  }

  open(m: AppModule): void {
    this.moduleService.select(m);
  }

  logout(): void {
    this.moduleService.clear();
    // use o método de logout que o seu AuthService já tem:
    this.auth.logout?.();
    this.router.navigate(['/login']);
  }
}