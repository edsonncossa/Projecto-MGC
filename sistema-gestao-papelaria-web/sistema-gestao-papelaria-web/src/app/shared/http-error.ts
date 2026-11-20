import { HttpErrorResponse } from '@angular/common/http';

/** Converte uma falha HTTP numa mensagem para o utilizador. O backend envia { message }. */
export function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as HttpErrorResponse;
  if (e?.status === 0) return 'Sem ligação ao servidor. Verifique a sua ligação e tente novamente.';
  const msg = (e?.error as any)?.message;
  if (typeof msg === 'string' && msg.trim() && msg.length <= 200) return msg;
  if (e?.status === 401) return 'A sua sessão expirou. Inicie sessão novamente.';
  if (e?.status === 403) return 'Não tem permissão para esta operação.';
  return fallback;
}