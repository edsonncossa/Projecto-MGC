// @app/shared/components/loading/loading.component.ts
import { Component } from '@angular/core';
import { LoadingService } from '../../services/loading.service';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule],
  template: `
    <div class="loading-overlay" *ngIf="loading$ | async">
      <div class="loading-content">
        <mat-progress-spinner
          diameter="100"
          mode="indeterminate"
          [color]="'primary'">
        </mat-progress-spinner>
        <p class="loading-text">Carregando...</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      /* ✅ Fundo transparente */
      background: transparent;
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .loading-text {
      /* Texto branco com sombra para destacar */
      color: #1f4e9a;
      font-size: 16px;
      font-weight: 500;
      margin: 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    /* Spinner vermelho */
    ::ng-deep .mat-progress-spinner circle {
      stroke: #1f4e9a !important;
      stroke-width: 4px !important;
    }

    ::ng-deep .mat-progress-spinner .mdc-circular-progress__indeterminate-circle {
      stroke: #1f4e9a !important;
    }
  `]
})
export class LoadingComponent {
  loading$ = this.loadingService.loading$;
  constructor(private loadingService: LoadingService) { }
}
