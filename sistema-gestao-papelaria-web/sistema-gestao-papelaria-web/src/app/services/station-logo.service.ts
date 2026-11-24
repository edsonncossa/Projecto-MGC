import { Injectable } from '@angular/core';

export interface LogoAsset {
  /** Nome apresentado no seletor. */
  nome: string;
  /** Caminho relativo à pasta src/assets. */
  ficheiro: string;
}

const CHAVE_STORAGE = 'station-logos';

/**
 * Logotipos disponíveis em src/assets. O Angular não consegue listar uma pasta em runtime,
 * por isso, quando juntar um logo novo à pasta, acrescente-o aqui.
 */
export const LOGOS_ASSETS: LogoAsset[] = [
  { nome: 'Carbon Capture', ficheiro: 'carbon-capture.webp' },
  { nome: 'CIM', ficheiro: 'CIM.jpeg' },
  { nome: 'Infarma', ficheiro: 'infarma.png' },
  { nome: 'Made in Mozambique', ficheiro: 'Made in Mozambique.png' },
  { nome: 'MGC', ficheiro: 'MGC-Logo.png' },
  { nome: 'Midal Cables', ficheiro: 'midal-cables.png' },
  { nome: 'Mogas', ficheiro: 'mogas.png' },
  { nome: 'Safira', ficheiro: 'safira.jpeg' },
];

/**
 * Guarda qual o logotipo de cada estação. A chave é o nome-base da estação
 * ("PRS1 (M1)" e "PRS1 (M2)" partilham o logo de "PRS1").
 *
 * Por agora a associação fica no localStorage deste browser. Quando o backend tiver um campo
 * para o logo, basta trocar `ler()` e `gravar()` por chamadas ao ClientService:
 * o resto da aplicação não muda.
 */
@Injectable({ providedIn: 'root' })
export class StationLogoService {
  private logos: Record<string, string> = this.ler();

  readonly catalogo = LOGOS_ASSETS;

  /** "PRS1 (M1)", "PRS1 - M2", "PRS1 M1" → "PRS1" (mesma regra do mapa e do dashboard). */
  chave(nome: string | null | undefined): string {
    const n = (nome ?? '').trim();
    const m = /^(.+?)\s*(?:\(\s*(M\d+)\s*\)|[-–]\s*(M\d+)|\s(M\d+))$/i.exec(n);
    return (m ? m[1].trim() : n).toUpperCase();
  }

  /** URL pronto a usar num <img>, ou null se a estação não tem logo. */
  obter(nome: string | null | undefined): string | null {
    const valor = this.logos[this.chave(nome)];
    return valor ? this.paraUrl(valor) : null;
  }

  /** Aceita um ficheiro da pasta assets ou um data URL (imagem carregada pelo utilizador). */
  definir(nome: string | null | undefined, valor: string): void {
    this.logos = { ...this.logos, [this.chave(nome)]: valor };
    this.gravar();
  }

  remover(nome: string | null | undefined): void {
    const { [this.chave(nome)]: _, ...resto } = this.logos;
    this.logos = resto;
    this.gravar();
  }

  /** Url de um ficheiro do catálogo (os nomes com espaços são codificados). */
  urlAsset(ficheiro: string): string {
    return `assets/${encodeURIComponent(ficheiro)}`;
  }

  private paraUrl(valor: string): string {
    return valor.startsWith('data:') ? valor : this.urlAsset(valor);
  }

  private ler(): Record<string, string> {
    try {
      return JSON.parse(localStorage.getItem(CHAVE_STORAGE) ?? '{}') ?? {};
    } catch {
      return {};
    }
  }

  private gravar(): void {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(this.logos));
    } catch {
      /* armazenamento cheio ou bloqueado: o logo vale só para esta sessão */
    }
  }
}
