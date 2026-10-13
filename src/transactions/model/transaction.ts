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

export interface TransactionView {
  id: string;
  conversationId: string;
  productId: string;
  productName: string;
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
