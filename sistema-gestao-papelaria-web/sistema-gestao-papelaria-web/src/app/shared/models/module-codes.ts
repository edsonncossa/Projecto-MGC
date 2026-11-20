/**
 * Códigos dos módulos, iguais aos devolvidos por GET /auth/modules (campo `code`).
 * Qualquer rota ou item de menu associado a um módulo usa estas constantes.
 */
export const MODULE_CODES = {
  CONSUMPTION: 'MODULE_CONSUMPTION',
  // Acrescente aqui os restantes, exactamente como vêm do backend:
  // CNG_SIMULATOR: 'MODULE_...',
} as const;
