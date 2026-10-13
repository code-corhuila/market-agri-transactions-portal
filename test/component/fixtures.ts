// Bodies of api-contract §4.2–§4.4 and E-40 as the services (or the simulated mode) answer them.
export const PRODUCT_ID = '5e1f0c2a-7b3d-4e8f-9a6b-000000000001';
export const CONVERSATION_ID = '7a7a7a7a-1b2c-4d3e-8f90-000000000001';
export const TRANSACTION_ID = '9c9c9c9c-1b2c-4d3e-8f90-000000000001';

export const product = (overrides: Record<string, unknown> = {}) => ({
  id: PRODUCT_ID,
  producerId: '0b6f2c7e-4a51-4c1e-9d0e-2f1c3a7b9e10',
  producerName: 'Ana Ruiz',
  name: 'Café especial de altura',
  category: 'CAFE',
  unit: 'ARROBA',
  quantity: 12.5,
  price: 185000,
  currency: 'COP',
  municipality: 'Garzón',
  status: 'ACTIVE',
  photoUrl: null,
  createdAt: '2026-10-01T14:00:00Z',
  updatedAt: '2026-10-01T14:00:00Z',
  ...overrides,
});

export const transaction = (overrides: Record<string, unknown> = {}) => ({
  id: TRANSACTION_ID,
  conversationId: CONVERSATION_ID,
  productId: PRODUCT_ID,
  productName: 'Café especial de altura',
  buyerId: '6a1d9b2c-3e4f-4a5b-8c6d-7e8f9a0b1c2d',
  buyerName: 'Carlos Pérez',
  producerId: '0b6f2c7e-4a51-4c1e-9d0e-2f1c3a7b9e10',
  producerName: 'Ana Ruiz',
  quantity: 2.5,
  unit: 'ARROBA',
  unitPrice: 185000,
  amount: 462500,
  currency: 'COP',
  status: 'PENDING',
  createdAt: '2026-10-13T15:00:00Z',
  confirmedAt: null,
  failedAt: null,
  ledger: null,
  ...overrides,
});

export const BUYER = {
  accessToken: 'header.claims.',
  expiresAt: '2099-01-01T00:00:00Z',
  user: {
    id: '6a1d9b2c-3e4f-4a5b-8c6d-7e8f9a0b1c2d',
    name: 'Carlos Pérez',
    email: 'comprador@market-agri.test',
    role: 'BUYER' as const,
  },
};
