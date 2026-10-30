import { BrowserRouter, Routes, Route } from 'react-router-dom';

import ManagerPage from './pages/ManagerPage';
import CashierPage from './pages/CashierPage';
import KioskPage from './pages/KioskPage';
import KitchenPage from './pages/KitchenPage';
import RoleSelector from './pages/RoleSelector';

export default function App() {
    return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={
              <RoleSelector />
          }
        />

        <Route
          path="/kiosk"
          element={
              <KioskPage />
          }
        />

        <Route
          path="/manager"
          element={
              <ManagerPage />
          }
        />

        <Route
          path="/cashier"
          element={
              <CashierPage />
          }
        />

        <Route
          path="/kitchen"
          element={
              <KitchenPage />
          }
        />
      </Routes>
    </BrowserRouter>
    );
}