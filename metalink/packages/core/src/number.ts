/**
 * Converte texto com decimal pt-BR (vírgula) ou ponto em número não negativo.
 * Retorna null para entrada inválida.
 */
export function parsePtBrDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (normalized === '' || !/^\d+(\.\d+)?$/.test(normalized)) {
    return null;
  }
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

/** Formata número para exibição pt-BR (vírgula decimal, sem zeros à direita). */
export function formatPtBrDecimal(value: number): string {
  return String(value).replace('.', ',');
}
