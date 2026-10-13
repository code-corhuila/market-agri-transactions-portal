import { Route, Routes } from 'react-router-dom';
import { NotFoundPage } from './transactions/pages/NotFoundPage';
import { PurchasesPage } from './transactions/pages/PurchasesPage';

/** Root of the portal, exposed as ./App: the container mounts it under /transacciones/* (ADR-021). */
export default function App() {
  return (
    <Routes>
      <Route index element={<PurchasesPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
