import { apiClient } from 'shell/apiClient';
import type { Checkout, ProductView } from '../model/transaction';

/** E-11, the product to buy. */
export function getProduct(id: string, signal: AbortSignal) {
  return apiClient.get<ProductView>(`/api/v1/catalog/products/${encodeURIComponent(id)}`, {
    signal,
  });
}

/**
 * The purchase from the buyer's side: E-30 (idempotent on product and buyer) gives the
 * conversation, E-34 records that it is paid through the platform, and E-40 starts the checkout
 * saga with the quantity only (D-C11). `idempotencyKey` is the same on a retry (D-C35).
 */
export async function startPurchase(productId: string, quantity: number, idempotencyKey: string) {
  const conversation = await apiClient.post<{ id: string }>('/api/v1/chat/conversations', {
    productId,
  });
  await apiClient.put(`/api/v1/chat/conversations/${conversation.id}/purchase-method`, {
    method: 'PLATFORM',
  });
  return apiClient.post<Checkout>(
    '/api/v1/workflow/checkouts',
    { conversationId: conversation.id, quantity },
    { idempotencyKey },
  );
}
