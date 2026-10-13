import { Link } from 'react-router-dom';
import { Badge, Card } from 'shell/ui';
import { formatDate, formatNumber, formatPesos } from '../model/money';
import { statusBadge, unitName, type TransactionView } from '../model/transaction';
import styles from './TransactionRow.module.css';

/** One purchase or sale: the product (link to its detail), total, status and the other party. */
export function TransactionRow({ item, other }: { item: TransactionView; other: string }) {
  const badge = statusBadge(item.status);
  return (
    <Card as="li" className={styles.row}>
      <div className={styles.top}>
        <Link to={item.id} className={styles.name}>
          {item.productName}
        </Link>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>
      <strong>{formatPesos(item.amount, { suffix: true })}</strong>
      <p className="subtle">
        {formatNumber(item.quantity)} {unitName(item.unit, item.quantity !== 1)} · {other} ·{' '}
        {formatDate(item.createdAt)}
      </p>
    </Card>
  );
}
