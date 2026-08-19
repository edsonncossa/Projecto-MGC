import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  color?: 'primary' | 'warn' | 'accent';
  icon?: string;
  iconColor?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  template: `

    <h2 mat-dialog-title class="dialog-title">
      <i *ngIf="data.icon"
        class="fa-solid"
        [class]="data.icon"
        [style.color]="data.iconColor || '#6B7280'">
      </i>
      {{ data.title }}
    </h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()" class="cancel">
        {{ data.cancelText }}
      </button>
      <button
        mat-raised-button
        [color]="data.color || 'primary'"
        (click)="onConfirm()"
        class="confirm"
      >
        <i *ngIf="data.icon" class="fa-solid" [class]="data.icon"></i>
        {{ data.confirmText }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 300px;
        margin: 16px 0;
      }

      .dialog-title {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 24px;
        font-size: 20px;
        font-weight: 600;
        color: #1f2937;
        border-bottom: 1px solid #e5e7eb;
      }

      .delete {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px; // Espaço entre ícone e texto
        background: #d32f2f;
        color: #ffffff;
        padding: 0 16px;
        height: 36px;
        font-size: 14px;
        font-weight: 500;
        text-transform: none;
        letter-spacing: 0;
        border-radius: 4px;
        box-shadow: 0 2px 4px rgba(153, 27, 27, 0.2);
        transition: all 0.2s ease;

        &:hover {
          background-color: #b71c1c;
          box-shadow: 0 4px 8px rgba(211, 47, 47, 0.3);
        }

        &:active {
          background: #7f1d1d;
          box-shadow: 0 1px 2px rgba(153, 27, 27, 0.2);
        }

        i {
          font-size: 18px;
          line-height: 1;
        }
      }

      .cancel {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: #f3f4f6;
        color: #6b7280;
        border: 1px solid #d1d5db;
        padding: 0 16px;
        height: 36px;
        font-size: 14px;
        font-weight: 500;
        text-transform: none;
        letter-spacing: 0;
        border-radius: 4px;
        transition: all 0.2s ease;

        &:hover {
          background: #e5e7eb;
          border-color: #9ca3af;
        }

        &:active {
          background: #d1d5db;
        }

        i {
          font-size: 18px;
          line-height: 1;
        }
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData,
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
