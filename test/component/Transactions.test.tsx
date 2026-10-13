import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { Link, MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { apiClient } from 'shell/apiClient';
import { clearSession, setSession } from 'shell/session';
import App from '../../src/App';
import { apiError } from '../doubles/shell/apiClient';
import { ADMIN, BUYER, PRODUCER, PRODUCT_ID, TRANSACTION_ID, page, transaction } from './fixtures';

// HU-TXN-001: after paying, each participant follows the transaction. E-41 (the detail) and E-42
// (the buyer's purchases or the producer's sales). The container mounts ./App under
// /transacciones/* behind RequireAuth.
const DETAIL = `/api/v1/transactions/${TRANSACTION_ID}`;
const MINE = '/api/v1/transactions/mine';

/** Where the router is: a redirect inside the portal shows here. */
function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/transacciones/*" element={<App />} />
      </Routes>
      <Link to="/transacciones?page=2">Ir a la página 2 (prueba)</Link>
      <Where />
    </MemoryRouter>,
  );
}

const get = () => vi.spyOn(apiClient, 'get');

afterEach(() => {
  clearSession();
  vi.useRealTimers();
});

describe('transaction detail (HU-TXN-001, E-41)', () => {
  beforeEach(() => setSession(BUYER));

  it('shows what was bought, from whom, the total and the status', async () => {
    const spy = get().mockResolvedValue(transaction());
    renderAt(`/transacciones/${TRANSACTION_ID}`);
    expect(screen.getByRole('status')).toHaveTextContent('Cargando…');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Café especial de altura' }),
    ).toBeInTheDocument();
    expect(spy).toHaveBeenCalledWith(DETAIL, expect.anything());
    expect(screen.getByText('Pendiente de pago')).toHaveAttribute('data-variant', 'warning');
    expect(screen.getByText('Ana Ruiz')).toBeInTheDocument();
    expect(screen.getByText('2,5 arrobas')).toBeInTheDocument();
    expect(screen.getByText('$ 185.000')).toBeInTheDocument();
    expect(screen.getByText('$ 462.500 COP')).toBeInTheDocument();
    expect(screen.getByText('13/10/2026 10:00')).toBeInTheDocument();
    expect(screen.queryByText('Neto a recibir')).not.toBeInTheDocument();
  });

  it('reads a PENDING transaction again every 3 seconds until it is settled', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const confirmed = transaction({ status: 'CONFIRMED', confirmedAt: '2026-10-13T15:02:00Z' });
    const spy = get().mockResolvedValueOnce(transaction()).mockResolvedValue(confirmed);
    renderAt(`/transacciones/${TRANSACTION_ID}`);
    expect(await screen.findByText('Pendiente de pago')).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(3000));
    expect(await screen.findByText('Confirmada')).toHaveAttribute('data-variant', 'success');
    expect(screen.getByText('13/10/2026 10:02')).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(9000));
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('says a failed payment did not go through and offers to try again', async () => {
    get().mockResolvedValue(transaction({ status: 'FAILED', failedAt: '2026-10-13T15:01:00Z' }));
    renderAt(`/transacciones/${TRANSACTION_ID}`);
    expect(await screen.findByText('Fallida')).toHaveAttribute('data-variant', 'danger');
    expect(screen.getByText('El pago no se completó.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Intentar de nuevo' })).toHaveAttribute(
      'href',
      `/transacciones/comprar/${PRODUCT_ID}`,
    );
  });

  it('shows the producer the buyer and the amount to receive once confirmed', async () => {
    setSession(PRODUCER);
    get().mockResolvedValue(
      transaction({
        status: 'CONFIRMED',
        confirmedAt: '2026-10-13T15:00:05Z',
        ledger: {
          grossAmount: 462500,
          platformFee: 0,
          netAmount: 462500,
          currency: 'COP',
          status: 'PENDING_DISBURSEMENT',
          createdAt: '2026-10-13T15:00:05Z',
        },
      }),
    );
    renderAt(`/transacciones/${TRANSACTION_ID}`);
    expect(await screen.findByText('Comprador')).toBeInTheDocument();
    expect(screen.getByText('Carlos Pérez')).toBeInTheDocument();
    expect(screen.getByText('Neto a recibir')).toBeInTheDocument();
    expect(screen.getByText('$ 462.500', { selector: 'dd' })).toBeInTheDocument();
    expect(screen.getByText('Pendiente de desembolso')).toBeInTheDocument();
    const crumbs = screen.getByRole('navigation', { name: 'Ruta de navegación' });
    expect(within(crumbs).getByRole('link', { name: 'Mis ventas' })).toHaveAttribute(
      'href',
      '/transacciones/ventas',
    );
  });

  it('shows its own 404 for an address that is not a transaction, without asking', () => {
    const spy = get();
    renderAt('/transacciones/no-existe');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Página no encontrada' }),
    ).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });

  it.each([
    [404, 'TRANSACTION_NOT_FOUND', 'La transacción no existe.'],
    [403, 'NOT_A_PARTICIPANT', 'No participa en esta transacción.'],
  ])('answers a %d with the message of the contract and a way back', async (status, code, text) => {
    get().mockRejectedValue(apiError(status, code, text));
    renderAt(`/transacciones/${TRANSACTION_ID}`);
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver mis compras' })).toHaveAttribute(
      'href',
      '/transacciones',
    );
  });

  it('shows another error with a retry', async () => {
    get()
      .mockRejectedValueOnce(apiError(0, 'NETWORK_ERROR', 'No se pudo conectar con el servidor.'))
      .mockResolvedValueOnce(transaction());
    renderAt(`/transacciones/${TRANSACTION_ID}`);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo conectar con el servidor.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Pendiente de pago')).toBeInTheDocument();
  });
});

describe('my purchases and my sales (HU-TXN-001, E-42)', () => {
  it('lists the buyer purchases, each one linked to its detail', async () => {
    setSession(BUYER);
    const spy = get().mockResolvedValue(page([transaction()]));
    renderAt('/transacciones');
    expect(screen.getByRole('heading', { level: 1, name: 'Mis compras' })).toBeInTheDocument();
    const [item] = await screen.findAllByRole('listitem');
    expect(spy).toHaveBeenCalledWith(`${MINE}?page=1&limit=20`, expect.anything());
    const row = within(item!);
    expect(row.getByRole('link', { name: 'Café especial de altura' })).toHaveAttribute(
      'href',
      `/transacciones/${TRANSACTION_ID}`,
    );
    expect(row.getByText('$ 462.500 COP')).toBeInTheDocument();
    expect(row.getByText('Pendiente de pago')).toHaveAttribute('data-variant', 'warning');
    expect(row.getByText(/Ana Ruiz/)).toHaveTextContent('2,5 arrobas · Ana Ruiz · 13/10/2026');
  });

  // The container's navigation (front, src/remotes/registry.ts) links the producer to
  // /transacciones/ventas and the buyer to /transacciones.
  it('lists the producer sales at /ventas with the buyer of each one', async () => {
    setSession(PRODUCER);
    get().mockResolvedValue(page([transaction({ status: 'CONFIRMED' })]));
    renderAt('/transacciones/ventas');
    expect(screen.getByRole('heading', { level: 1, name: 'Mis ventas' })).toBeInTheDocument();
    expect(await screen.findByText(/Carlos Pérez/)).toBeInTheDocument();
    expect(screen.getByText('Confirmada')).toHaveAttribute('data-variant', 'success');
    expect(screen.getByRole('link', { name: 'Café especial de altura' })).toHaveAttribute(
      'href',
      `/transacciones/${TRANSACTION_ID}`,
    );
  });

  it('takes each role to the address of its own list', async () => {
    get().mockResolvedValue(page([]));
    setSession(PRODUCER);
    const { unmount } = renderAt('/transacciones');
    expect(await screen.findByText('Todavía no tiene ventas.')).toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent('/transacciones/ventas');
    unmount();

    setSession(BUYER);
    renderAt('/transacciones/ventas');
    expect(await screen.findByText('Todavía no tiene compras.')).toBeInTheDocument();
    expect(screen.getByTestId('where')).toHaveTextContent(/^\/transacciones$/);
  });

  it('guides an empty list: the buyer to the catalog, the producer with a sentence', async () => {
    setSession(BUYER);
    get().mockResolvedValue(page([]));
    const { unmount } = renderAt('/transacciones');
    expect(await screen.findByText('Todavía no tiene compras.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ver el catálogo' })).toHaveAttribute(
      'href',
      '/catalogo',
    );
    unmount();

    setSession(PRODUCER);
    renderAt('/transacciones/ventas');
    expect(await screen.findByText('Todavía no tiene ventas.')).toBeInTheDocument();
  });

  it('asks for the page of the address and moves between pages', async () => {
    setSession(BUYER);
    const spy = get().mockImplementation(async (path: string) => {
      const current = Number(new URL(path, 'http://x').searchParams.get('page'));
      return page([transaction({ id: `${TRANSACTION_ID.slice(0, -1)}${current}` })], {
        page: current,
        total: 45,
      });
    });
    renderAt('/transacciones?page=2');
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
    expect(spy).toHaveBeenLastCalledWith(`${MINE}?page=2&limit=20`, expect.anything());
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText('Página 3 de 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
  });

  it('says when the page of the address is past the last one and links to the last', async () => {
    setSession(BUYER);
    get().mockResolvedValue(page([], { page: 9, total: 45 }));
    renderAt('/transacciones?page=9');
    expect(await screen.findByText('La página 9 no existe.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ir a la página 3' })).toHaveAttribute(
      'href',
      '/transacciones?page=3',
    );
  });

  // The answer of a request already replaced never wins, even if the client resolves it.
  it('keeps the newest page when an older answer arrives late', async () => {
    setSession(BUYER);
    let answerFirst: (value: unknown) => void = () => {};
    get()
      .mockImplementationOnce(
        () => new Promise<unknown>((done) => (answerFirst = done)) as Promise<never>,
      )
      .mockResolvedValueOnce(
        page([transaction({ productName: 'Página dos' })], { page: 2, total: 45 }),
      );
    renderAt('/transacciones?page=1');
    fireEvent.click(screen.getByRole('link', { name: 'Ir a la página 2 (prueba)' }));
    expect(await screen.findByRole('link', { name: 'Página dos' })).toBeInTheDocument();
    await act(async () =>
      answerFirst(page([transaction({ productName: 'Página uno' })], { total: 45 })),
    );
    expect(screen.queryByRole('link', { name: 'Página uno' })).not.toBeInTheDocument();
  });

  it('shows the error with a retry that asks again', async () => {
    setSession(BUYER);
    get()
      .mockRejectedValueOnce(
        apiError(503, 'SERVICE_UNAVAILABLE', 'El servicio no está disponible en este momento.'),
      )
      .mockResolvedValueOnce(page([transaction()]));
    renderAt('/transacciones');
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El servicio no está disponible en este momento.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByRole('link', { name: 'Café especial de altura' })).toBeVisible();
  });

  it('is for buyers and producers: an administrator gets no list from E-42', () => {
    setSession(ADMIN);
    const spy = get();
    renderAt('/transacciones');
    expect(
      screen.getByText('Las compras y las ventas son de compradores y productores.'),
    ).toBeInTheDocument();
    expect(spy).not.toHaveBeenCalled();
  });
});
