import { Severity, Status, Verdict } from '../models/cng.models';

const cache = new Map<number, Intl.NumberFormat>();

function nf(digits: number): Intl.NumberFormat {
  let f = cache.get(digits);
  if (!f) {
    f = new Intl.NumberFormat('pt-PT', { minimumFractionDigits: digits, maximumFractionDigits: digits });
    cache.set(digits, f);
  }
  return f;
}

/** 12,3 — com vírgula decimal. Valores não finitos aparecem como "—". */
export function fmtNum(v: number, digits = 1): string {
  return isFinite(v) ? nf(digits).format(v) : '—';
}

/** Fração para percentagem: 0,716 → "71,6%". */
export function fmtPct(frac: number, digits = 1): string {
  return isFinite(frac) ? nf(digits).format(frac * 100) + '%' : '—';
}

/** Com sinal explícito: +39,7% / −12,0%. */
export function fmtSigned(frac: number, digits = 1): string {
  if (!isFinite(frac)) return '—';
  const text = nf(digits).format(Math.abs(frac * 100));
  const isZero = /^0([.,]0+)?$/.test(text);
  return (frac < 0 && !isZero ? '−' : '+') + text + '%';
}

export const STATUS_LABEL: Record<Status, string> = {
  OFFLINE: 'Offline',
  UNDER_USED: 'Subutilizado',
  OK: 'Normal',
  HIGH: 'Elevado',
  OVERLOAD: 'Sobrecarga',
  CRITICAL: 'Crítico',
  INSUFFICIENT: 'Insuficiente'
};

export const VERDICT_LABEL: Record<Verdict, string> = {
  VIABLE: 'Viável',
  AT_LIMIT: 'Viável no limite',
  UNVIABLE: 'Inviável'
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Média',
  low: 'Baixa'
};
