import { formatDateTime } from '../../src/transactions/model/money';
import { isTransactionId, statusBadge } from '../../src/transactions/model/transaction';

// The transaction as the domain reads it: its id is a UUID (E-41), its status is interpreted here
// and not in shell/ui (which only knows colours), and dates are shown in Colombian time.
describe('transaction model', () => {
  it('knows a transaction id from any other address below the portal', () => {
    expect(isTransactionId('9c9c9c9c-1b2c-4d3e-8f90-000000000001')).toBe(true);
    expect(isTransactionId('9C9C9C9C-1B2C-4D3E-8F90-000000000001')).toBe(true);
    expect(isTransactionId('no-existe')).toBe(false);
    expect(isTransactionId('9c9c9c9c-1b2c-4d3e-8f90-0000000000011')).toBe(false);
  });

  it.each([
    ['PENDING', 'warning', 'Pendiente de pago'],
    ['CONFIRMED', 'success', 'Confirmada'],
    ['FAILED', 'danger', 'Fallida'],
  ] as const)('shows %s as a %s badge that says %j', (status, variant, label) => {
    expect(statusBadge(status)).toEqual({ variant, label });
  });

  it('shows a timestamp in Colombian time, day first', () => {
    expect(formatDateTime('2026-10-13T15:00:00Z')).toBe('13/10/2026 10:00');
    expect(formatDateTime('2026-01-01T04:30:00Z')).toBe('31/12/2025 23:30');
  });
});
