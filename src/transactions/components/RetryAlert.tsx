import { Alert, Button } from 'shell/ui';

/** Error with retry (Annex H): the contract's message and one way to ask again. */
export function RetryAlert({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="stack">
      <Alert variant="error">{message}</Alert>
      <div>
        <Button variant="secondary" onClick={onRetry}>
          Reintentar
        </Button>
      </div>
    </div>
  );
}
