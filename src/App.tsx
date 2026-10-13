import { Route, Routes } from 'react-router-dom';
import { NotFoundPage } from './transactions/pages/NotFoundPage';
import { CheckoutPage } from './transactions/pages/CheckoutPage';
import { MyTransactionsPage } from './transactions/pages/MyTransactionsPage';
import { TransactionPage } from './transactions/pages/TransactionPage';

/** Root of the portal, exposed as ./App: the container mounts it under /transacciones/* (ADR-021). */
export default function App() {
  return (
    <Routes>
      <Route index element={<MyTransactionsPage />} />
      <Route path="comprar/:productId" element={<CheckoutPage />} />
      <Route path=":id" element={<TransactionPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
