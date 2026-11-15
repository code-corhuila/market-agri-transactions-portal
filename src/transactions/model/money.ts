// The one place where this portal formats and reads values (design-system.md, "Formats").
const PESOS = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const QUANTITY = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

const CENTS_PER_PESO = 100;

/**
 * Money from integer centavos (ADR-029, design-system.md "Money"): `46250000` → `$ 462.500`;
 * `8500050` → `$ 85.000,50` (centavos only when not zero); with `suffix`, ` COP` (only on totals).
 * Pesos and centavos are split with integer arithmetic: no amount goes through a float division.
 */
export function formatCents(cents: number, { suffix = false } = {}): string {
  const pesos = Math.trunc(cents / CENTS_PER_PESO);
  const rest = cents % CENTS_PER_PESO;
  const centavos = rest === 0 ? '' : `,${String(rest).padStart(2, '0')}`;
  return `$ ${PESOS.format(pesos)}${centavos}${suffix ? ' COP' : ''}`;
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

/**
 * D-C11 as the server computes it (amended 2026-11-01): round_half_up(quantity × unitPriceCents, 0)
 * in integer centavos. The quantity has at most 2 decimals (D-C7), so it is taken in hundredths.
 */
export function estimatedAmountCents(quantity: number, unitPriceCents: number): number {
  const hundredths = Math.round(quantity * 100);
  return Math.floor((hundredths * unitPriceCents + 50) / 100);
}

const DATE_TIME = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function partsOf(timestamp: string): Record<string, string> {
  const parts = DATE_TIME.formatToParts(new Date(timestamp));
  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
}

/** `2026-10-13T15:00:00Z` → `13/10/2026`, in Colombian time whatever the browser's zone. */
export function formatDate(timestamp: string): string {
  const { day, month, year } = partsOf(timestamp);
  return `${day}/${month}/${year}`;
}

/** `2026-10-13T15:00:00Z` → `13/10/2026 10:00`. */
export function formatDateTime(timestamp: string): string {
  const { hour, minute } = partsOf(timestamp);
  return `${formatDate(timestamp)} ${hour}:${minute}`;
}
