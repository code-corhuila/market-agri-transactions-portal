import { PackageX, ShoppingBasket } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, EmptyState, Field, LoadingBlock, PageHeader } from 'shell/ui';
import { useSession } from 'shell/useSession';
import { getProduct, startPurchase } from '../api/purchase';
import { useRemote } from '../api/useRemote';
import { RetryAlert } from '../components/RetryAlert';
import { estimatedAmount, formatNumber, formatPesos, parseQuantity } from '../model/money';
import { unitName, type ProductView } from '../model/transaction';

const REQUIRED = 'Es obligatorio.';
const NOT_A_QUANTITY = 'Use un número mayor que cero, con máximo 2 decimales.';

/** HU-TXN-001: the buyer chooses the quantity of a product and goes to pay it (E-40). */
export function CheckoutPage() {
  const session = useSession();
  const productId = useParams().productId ?? '';
  const { remote, reload } = useRemote((signal) => getProduct(productId, signal), productId);

  if (session?.user.role !== 'BUYER') {
    return <EmptyState icon={ShoppingBasket} title="Solo una cuenta de comprador puede comprar." />;
  }
  if (remote.state === 'loading') return <LoadingBlock />;
  if (remote.state === 'error' && remote.error.error === 'PRODUCT_NOT_FOUND') {
    return <EmptyState icon={PackageX} title={remote.error.message} />;
  }
  if (remote.state === 'error')
    return <RetryAlert message={remote.error.message} onRetry={reload} />;
  return <CheckoutForm product={remote.data} />;
}

function CheckoutForm({ product }: { product: ProductView }) {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [fieldError, setFieldError] = useState<string>();
  const [failure, setFailure] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // One key per intention (D-C35): a retry of the same quantity reuses it, a new quantity renews it.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const quantity = parseQuantity(text);
  const available = `${formatNumber(product.quantity)} ${unitName(product.unit, true)}`;

  function change(value: string) {
    setText(value);
    setIdempotencyKey(crypto.randomUUID());
  }

  function check(): string | undefined {
    if (!text.trim()) return REQUIRED;
    if (quantity === null) return NOT_A_QUANTITY;
    if (quantity > product.quantity) return `Hay ${available} disponibles.`;
    return undefined;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const error = check();
    setFieldError(error);
    setFailure(null);
    if (error || quantity === null || pending) return;
    setPending(true);
    try {
      const { checkoutUrl } = await startPurchase(product.id, quantity, idempotencyKey);
      // Stripe Checkout lives elsewhere; the simulated mode answers a page of this application.
      if (checkoutUrl.startsWith('/')) navigate(checkoutUrl);
      else window.location.assign(checkoutUrl);
    } catch (caught) {
      const apiError = caught as { error?: string; message?: string };
      if (apiError.error === 'QUANTITY_NOT_POSITIVE') setFieldError(apiError.message);
      else setFailure(apiError.message ?? 'Ocurrió un error inesperado.');
      setPending(false);
    }
  }

  return (
    <section className="stack">
      <PageHeader
        title={`Comprar ${product.name}`}
        subtitle={`${formatPesos(product.price)} por ${unitName(product.unit)} · Disponible: ${available}`}
      />
      {product.status === 'OUT_OF_STOCK' ? (
        <EmptyState
          icon={PackageX}
          title="Este producto está agotado."
          action={<Link to="/catalogo">Ver el catálogo</Link>}
        />
      ) : (
        <Card>
          <form className="stack" onSubmit={handleSubmit} noValidate>
            {failure && <Alert variant="error">{failure}</Alert>}
            <Field label={`Cantidad (${unitName(product.unit, true)})`} error={fieldError} required>
              <input inputMode="decimal" value={text} onChange={(e) => change(e.target.value)} />
            </Field>
            {quantity !== null && (
              <p>
                Total estimado:{' '}
                {formatPesos(estimatedAmount(quantity, product.price), { suffix: true })}
              </p>
            )}
            <p className="subtle">
              El pago se hace por la plataforma; el valor final lo calcula el servidor.
            </p>
            <div>
              <Button type="submit" loading={pending}>
                Ir a pagar
              </Button>
            </div>
          </form>
        </Card>
      )}
    </section>
  );
}
