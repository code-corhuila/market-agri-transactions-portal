/** Types of api-contract §4.2–§4.4 and E-40, with the same field names (Annex H, rule 2). */
export type TransactionStatus = 'PENDING' | 'CONFIRMED' | 'FAILED';

/** The part of `ProductView` (E-11) that the checkout shows. */
export interface ProductView {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  status: 'ACTIVE' | 'OUT_OF_STOCK';
  producerName: string;
}

/** D-C14: what the producer will receive, only once CONFIRMED and only for the producer. */
export interface LedgerView {
  grossAmount: number;
  platformFee: number;
  netAmount: number;
  currency: 'COP';
  status: 'PENDING_DISBURSEMENT';
  createdAt: string;
}

export interface TransactionView {
  id: string;
  conversationId: string;
  productId: string;
  productName: string;
  buyerId: string;
  buyerName: string;
  producerId: string;
  producerName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  amount: number;
  currency: 'COP';
  status: TransactionStatus;
  createdAt: string;
  confirmedAt: string | null;
  failedAt: string | null;
  ledger: LedgerView | null;
}

/** D-C24: `{ data, meta }`. */
export interface Page<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** E-41 takes a UUID: any other address below the portal is the portal's own 404. */
export function isTransactionId(text: string): boolean {
  return UUID.test(text);
}

const STATUS_BADGE = {
  PENDING: { variant: 'warning', label: 'Pendiente de pago' },
  CONFIRMED: { variant: 'success', label: 'Confirmada' },
  FAILED: { variant: 'danger', label: 'Fallida' },
} as const;

/** The domain decides what each status looks like; shell/ui only knows colours. */
export function statusBadge(status: TransactionStatus) {
  return STATUS_BADGE[status];
}

/** E-40's answer: the PENDING transaction and where to pay it. */
export interface Checkout {
  transaction: TransactionView;
  checkoutUrl: string;
}

// Units by name: [singular, plural].
const UNITS: Record<string, readonly [string, string]> = {
  KILOGRAMO: ['kilogramo', 'kilogramos'],
  LIBRA: ['libra', 'libras'],
  ARROBA: ['arroba', 'arrobas'],
  BULTO: ['bulto', 'bultos'],
  CANASTA: ['canasta', 'canastas'],
  CAJA: ['caja', 'cajas'],
  DOCENA: ['docena', 'docenas'],
  MANOJO: ['manojo', 'manojos'],
  LITRO: ['litro', 'litros'],
  UNIDAD: ['unidad', 'unidades'],
};

export function unitName(unit: string, plural = false): string {
  const names = UNITS[unit] ?? [unit.toLowerCase(), unit.toLowerCase()];
  return names[plural ? 1 : 0];
}
