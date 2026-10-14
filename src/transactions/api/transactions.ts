import { apiClient } from 'shell/apiClient';
import type { Page, TransactionView } from '../model/transaction';

/** Rows per page of E-42 (D-C24 allows up to 100). */
export const PAGE_SIZE = 20;

/** E-41, for a participant. */
export function getTransaction(id: string, signal: AbortSignal) {
  return apiClient.get<TransactionView>(`/api/v1/transactions/${encodeURIComponent(id)}`, {
    signal,
  });
}

/** E-42: the buyer's purchases or the producer's sales, newest first. */
export function getMyTransactions(page: number, signal: AbortSignal) {
  return apiClient.get<Page<TransactionView>>(
    `/api/v1/transactions/mine?page=${page}&limit=${PAGE_SIZE}`,
    { signal },
  );
}
