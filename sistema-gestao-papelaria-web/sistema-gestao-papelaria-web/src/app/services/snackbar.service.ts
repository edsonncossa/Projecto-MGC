// @app/core/services/snackbar.service.ts
import { Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarHorizontalPosition, MatSnackBarVerticalPosition } from '@angular/material/snack-bar';

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarConfig {
  duration?: number;
  horizontalPosition?: MatSnackBarHorizontalPosition;
  verticalPosition?: MatSnackBarVerticalPosition;
  panelClass?: string | string[];
}

@Injectable({
  providedIn: 'root'  //  Disponível globalmente
})
export class SnackbarService {

  //  Configuração padrão
  private defaultConfig: SnackbarConfig = {
    duration: 4000,
    horizontalPosition: 'end',
    verticalPosition: 'top',
  };

  // Mapeamento de estilos por tipo
  private typeStyles: Record<SnackbarType, string> = {
    success: 'success-snackbar',
    error: 'error-snackbar',
    warning: 'warning-snackbar',
    info: 'info-snackbar'
  };

  constructor(private snackBar: MatSnackBar) {}

  // Método genérico (base para todos os outros)
  open(
    message: string,
    type: SnackbarType = 'info',
    config?: SnackbarConfig
  ): void {
    const mergedConfig = {
      ...this.defaultConfig,
      ...config,
      panelClass: [this.typeStyles[type], ...(config?.panelClass || [])]
    };

    this.snackBar.open(message, 'Fechar', mergedConfig);
  }

  //  Métodos específicos para cada tipo (facilita o uso)
  success(message: string, config?: SnackbarConfig): void {
    this.open(message, 'success', config);
  }

  error(message: string, config?: SnackbarConfig): void {
    this.open(message, 'error', config);
  }

  warning(message: string, config?: SnackbarConfig): void {
    this.open(message, 'warning', config);
  }

  info(message: string, config?: SnackbarConfig): void {
    this.open(message, 'info', config);
  }

  //  Método para snackbar com ação personalizada
  openWithAction(
    message: string,
    action: string,
    type: SnackbarType = 'info',
    onAction?: () => void,
    config?: SnackbarConfig
  ): void {
    const mergedConfig = {
      ...this.defaultConfig,
      ...config,
      panelClass: [this.typeStyles[type], ...(config?.panelClass || [])]
    };

    const ref = this.snackBar.open(message, action, mergedConfig);

    if (onAction) {
      ref.onAction().subscribe(onAction);
    }
  }
}
