import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { apiClient } from 'shell/apiClient';
import { clearSession, setSession } from 'shell/session';
import App from '../../src/App';
import { apiError } from '../doubles/shell/apiClient';
import {
  BUYER,
  CONVERSATION_ID,
  PRODUCT_ID,
  TRANSACTION_ID,
  product,
  transaction,
} from './fixtures';

// HU-TXN-001 against the checkout saga: E-11 (the product), E-30 (the conversation), E-34 (pay
// through the platform) and E-40 (workflow), then E-41. The container mounts ./App under
// /transacciones/* behind RequireAuth; the price is never sent (D-C11).
const CHECKOUT = `/transacciones/comprar/${PRODUCT_ID}`;

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/transacciones/*" element={<App />} />
        <Route
          path={`/transacciones/${TRANSACTION_ID}`}
          element={<p>Transacción {TRANSACTION_ID} (probe)</p>}
        />
      </Routes>
    </MemoryRouter>,
  );
}

/** apiClient answering the saga's calls; E-40 as given. */
function stubSaga(checkout: () => Promise<unknown>) {
  vi.spyOn(apiClient, 'get').mockImplementation(async (path: string) =>
    path.includes('/transactions/') ? transaction() : product(),
  );
  vi.spyOn(apiClient, 'put').mockResolvedValue({ id: CONVERSATION_ID });
  return vi
    .spyOn(apiClient, 'post')
    .mockImplementation(async (path: string) =>
      path.endsWith('/conversations') ? { id: CONVERSATION_ID } : checkout(),
    );
}

const quantity = () => screen.getByLabelText('Cantidad (arrobas)');
const pay = () => screen.getByRole('button', { name: 'Ir a pagar' });

beforeEach(() => setSession(BUYER));
afterEach(() => clearSession());

describe('start a purchase (HU-TXN-001)', () => {
  it('shows the product, its available stock and the estimated total', async () => {
    stubSaga(async () => ({}));
    renderAt(CHECKOUT);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Comprar Café especial de altura' }),
    ).toBeInTheDocument();
    expect(screen.getByText('$ 185.000 por arroba · Disponible: 12,5 arrobas')).toBeInTheDocument();
    fireEvent.change(quantity(), { target: { value: '2,5' } });
    expect(screen.getByText('Total estimado: $ 462.500 COP')).toBeInTheDocument();
  });

  it('opens the conversation, agrees to pay through the platform and starts the saga without a price', async () => {
    const post = stubSaga(async () => ({
      transaction: transaction(),
      checkoutUrl: `/transacciones/${TRANSACTION_ID}`,
    }));
    const put = vi.mocked(apiClient.put);
    renderAt(CHECKOUT);
    fireEvent.change(await screen.findByLabelText('Cantidad (arrobas)'), {
      target: { value: '2,5' },
    });
    fireEvent.click(pay());

    // checkoutUrl of the simulated mode: the transaction's page (G7b); Stripe's would be external.
    expect(await screen.findByText(`Transacción ${TRANSACTION_ID} (probe)`)).toBeInTheDocument();
    expect(post).toHaveBeenNthCalledWith(1, '/api/v1/chat/conversations', {
      productId: PRODUCT_ID,
    });
    expect(put).toHaveBeenCalledWith(
      `/api/v1/chat/conversations/${CONVERSATION_ID}/purchase-method`,
      {
        method: 'PLATFORM',
      },
    );
    expect(post).toHaveBeenNthCalledWith(
      2,
      '/api/v1/workflow/checkouts',
      { conversationId: CONVERSATION_ID, quantity: 2.5 },
      { idempotencyKey: expect.stringMatching(/^[0-9a-f-]{36}$/) },
    );
  });

  it('reuses the Idempotency-Key when the person retries the same purchase', async () => {
    const post = stubSaga(() =>
      Promise.reject(apiError(0, 'TIMEOUT', 'El servidor tardó demasiado en responder.')),
    );
    renderAt(CHECKOUT);
    fireEvent.change(await screen.findByLabelText('Cantidad (arrobas)'), {
      target: { value: '2' },
    });
    fireEvent.click(pay());
    expect(await screen.findByRole('alert')).toHaveTextContent('El servidor tardó demasiado');
    fireEvent.click(pay());
    await waitFor(() => expect(post).toHaveBeenCalledTimes(4));
    const keys = post.mock.calls
      .filter(([path]) => path === '/api/v1/workflow/checkouts')
      .map(([, , options]) => (options as { idempotencyKey: string }).idempotencyKey);
    expect(keys[0]).toBe(keys[1]);
  });

  it.each([
    ['', 'Es obligatorio.'],
    ['1.125', 'Use un número mayor que cero, con máximo 2 decimales.'],
    ['0', 'Use un número mayor que cero, con máximo 2 decimales.'],
    ['13', 'Hay 12,5 arrobas disponibles.'],
  ])('checks the quantity %j next to the field and sends nothing', async (text, message) => {
    const post = stubSaga(async () => ({}));
    renderAt(CHECKOUT);
    fireEvent.change(await screen.findByLabelText('Cantidad (arrobas)'), {
      target: { value: text },
    });
    fireEvent.click(pay());
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(quantity()).toHaveAttribute('aria-invalid', 'true');
    expect(post).not.toHaveBeenCalled();
  });

  it('shows the refusal of the saga with its message', async () => {
    const message = 'Cantidad insuficiente: hay 1 disponibles y se solicitaron 2.';
    stubSaga(() => Promise.reject(apiError(409, 'INSUFFICIENT_STOCK', message)));
    renderAt(CHECKOUT);
    fireEvent.change(await screen.findByLabelText('Cantidad (arrobas)'), {
      target: { value: '2' },
    });
    fireEvent.click(pay());
    expect(await screen.findByRole('alert')).toHaveTextContent(message);
    expect(pay()).toBeEnabled();
  });

  it('says when the product is out of stock and offers no form', async () => {
    stubSaga(async () => ({}));
    vi.mocked(apiClient.get).mockResolvedValue(product({ status: 'OUT_OF_STOCK', quantity: 0 }));
    renderAt(CHECKOUT);
    expect(await screen.findByText('Este producto está agotado.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ir a pagar' })).not.toBeInTheDocument();
  });

  it('is only for buyers', async () => {
    setSession({ ...BUYER, user: { ...BUYER.user, role: 'PRODUCER' } });
    stubSaga(async () => ({}));
    renderAt(CHECKOUT);
    expect(
      await screen.findByText('Solo una cuenta de comprador puede comprar.'),
    ).toBeInTheDocument();
  });
});
