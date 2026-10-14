import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState, PageHeader } from 'shell/ui';

/** An address below the portal's route that it does not own (Annex H: "404"). */
export function NotFoundPage() {
  return (
    <section className="stack">
      <PageHeader title="Página no encontrada" />
      <EmptyState
        icon={Compass}
        title="La dirección no existe."
        action={<Link to="/">Volver al inicio</Link>}
      />
    </section>
  );
}
