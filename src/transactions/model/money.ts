// The one place where this portal formats and reads values (design-system.md, "Formats").
const PESOS = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const QUANTITY = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

/** `462500` → `$ 462.500`; with `suffix`, `$ 462.500 COP` (only on totals). ADR-026. */
export function formatPesos(pesos: number, { suffix = false } = {}): string {
  return `$ ${PESOS.format(pesos)}${suffix ? ' COP' : ''}`;
}

export function formatNumber(quantity: number): string {
  return QUANTITY.format(quantity);
}

/** D-C7: digits with an optional `,` or `.` and at most 2 decimals, greater than zero. */
export function parseQuantity(text: string): number | null {
  const match = /^(\d+)(?:[.,](\d{1,2}))?$/.exec(text.trim());
  if (!match) return null;
  const value = Number(`${match[1]}.${match[2] ?? '0'}`);
  return value > 0 ? value : null;
}

/** D-C11 as the server computes it: round_half_up(quantity × unitPrice, 0), in hundredths. */
export function estimatedAmount(quantity: number, unitPrice: number): number {
  return Math.floor((Math.round(quantity * 100) * unitPrice + 50) / 100);
}
