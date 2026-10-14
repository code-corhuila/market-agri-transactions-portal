// Addresses of this portal as the container mounts it (/transacciones/*, ADR-021) and links to it
// from its navigation (front, src/remotes/registry.ts): the buyer's purchases and the producer's
// sales are two addresses over the same E-42.
export const PURCHASES_PATH = '/transacciones';
export const SALES_PATH = '/transacciones/ventas';

export const transactionPath = (id: string) => `${PURCHASES_PATH}/${id}`;
