import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NbIconModule } from '@nebular/theme';

import { StationLogoService } from '@app/services/station-logo.service';

export interface LogoPickerData {
  /** Nome da estação (ex.: "PRS1 (M1)"). */
  nome: string;
  /** Logo atual, se existir. */
  atual: string | null;
}

/** Fecha com: o valor escolhido (ficheiro ou data URL), '' para remover, ou undefined se cancelar. */
@Component({
  selector: 'app-logo-picker-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, NbIconModule],
  styles: [`
    :host { display: block; }
    h2 { margin: 0 0 .2rem; font-size: 1.1rem; }
    .sub { margin: 0 0 1rem; color: #6b7686; font-size: .85rem; }
    .grelha { display: grid; grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); gap: .6rem; }
    .opcao { display: flex; flex-direction: column; align-items: center; gap: .35rem; padding: .5rem;
      border: 2px solid rgba(120,130,145,.28); border-radius: 12px; background: #fff; cursor: pointer;
      font-size: .74rem; color: #3a4452; transition: border-color .15s, transform .15s; }
    .opcao:hover { border-color: #3b7dd8; transform: translateY(-1px); }
    .opcao.ativa { border-color: #00b383; box-shadow: 0 0 0 3px rgba(0,179,131,.18); }
    .opcao img { width: 72px; height: 72px; object-fit: contain; }
    .carregar { background: transparent; border-style: dashed; justify-content: center; min-height: 112px; }
    .carregar nb-icon { width: 1.6rem; height: 1.6rem; }
    input[type=file] { display: none; }
    .erro { color: #c92a4f; font-size: .8rem; margin: .6rem 0 0; }
    .rodape { display: flex; justify-content: space-between; margin-top: 1.1rem; }
    button.txt { border: 0; background: transparent; padding: .45rem .8rem; border-radius: 8px;
      cursor: pointer; font-weight: 600; color: inherit; }
    button.txt:hover { background: rgba(120,130,145,.16); }
    button.txt.perigo { color: #c92a4f; }
  `],
  template: `
    <h2>Logotipo da estação</h2>
    <p class="sub">{{ data.nome }}. Escolha um logo da pasta assets ou carregue outro.</p>

    <div class="grelha">
      <button type="button" class="opcao" *ngFor="let l of logos.catalogo"
              [class.ativa]="logos.urlAsset(l.ficheiro) === data.atual"
              (click)="dialogRef.close(l.ficheiro)">
        <img [src]="logos.urlAsset(l.ficheiro)" [alt]="l.nome">
        <span>{{ l.nome }}</span>
      </button>

      <label class="opcao carregar">
        <nb-icon icon="upload-outline" pack="eva"></nb-icon>
        <span>Carregar imagem</span>
        <input type="file" accept="image/*" (change)="aoCarregar($event)">
      </label>
    </div>

    <p class="erro" *ngIf="erro">{{ erro }}</p>

    <div class="rodape">
      <button type="button" class="txt perigo" *ngIf="data.atual" (click)="dialogRef.close('')">Remover logo</button>
      <span *ngIf="!data.atual"></span>
      <button type="button" class="txt" (click)="dialogRef.close()">Cancelar</button>
    </div>
  `,
})
export class LogoPickerDialogComponent {
  erro: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<LogoPickerDialogComponent, string | undefined>,
    @Inject(MAT_DIALOG_DATA) public data: LogoPickerData,
    public logos: StationLogoService,
  ) {}

  /** Reduz a imagem a 160 px para ocupar pouco espaço no armazenamento. */
  aoCarregar(ev: Event): void {
    const ficheiro = (ev.target as HTMLInputElement).files?.[0];
    if (!ficheiro) return;
    this.erro = null;

    if (!ficheiro.type.startsWith('image/')) {
      this.erro = 'O ficheiro escolhido não é uma imagem.';
      return;
    }

    const leitor = new FileReader();
    leitor.onload = () => {
      const img = new Image();
      img.onload = () => {
        const escala = Math.min(1, 160 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * escala));
        canvas.height = Math.max(1, Math.round(img.height * escala));
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        this.dialogRef.close(canvas.toDataURL('image/png'));
      };
      img.onerror = () => (this.erro = 'Não foi possível ler esta imagem.');
      img.src = String(leitor.result);
    };
    leitor.readAsDataURL(ficheiro);
  }
}
