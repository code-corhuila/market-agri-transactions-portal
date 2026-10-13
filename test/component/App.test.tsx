import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { apiClient } from 'shell/apiClient';
import { clearSession, setSession } from 'shell/session';
import App from '../../src/App';
import { BUYER, page } from './fixtures';

// The container mounts ./App under /transacciones/* (ADR-021): every route below it is this portal's.
function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

afterEach(() => clearSession());

describe('transactions portal', () => {
  it('opens on its main page', () => {
    setSession(BUYER);
    vi.spyOn(apiClient, 'get').mockResolvedValue(page([]));
    renderAt('/');
    expect(screen.getByRole('heading', { level: 1, name: 'Mis compras' })).toBeInTheDocument();
  });

  it('shows the 404 page for an address below it that does not exist', () => {
    renderAt('/no-existe');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Página no encontrada' }),
    ).toBeInTheDocument();
    // Its one way out: back to the home of the platform.
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  });
});
