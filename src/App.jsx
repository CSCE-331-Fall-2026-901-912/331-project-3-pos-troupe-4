import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles.css'

import ManagerPage from './pages/ManagerPage';
import CashierPage from './pages/cashier/CashierPage';
import KioskPage from './pages/KioskPage';
import KitchenPage from './pages/KitchenPage';
import RoleSelector from './pages/RoleSelector';
import { CartProvider } from './components/Cashier/CartHandling';

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

        <Route 
          path = "/cashier" 
          element={
            <CashierPage />
          }
        />

        <Route 
          path = "/cashier/customize" 
          element={
            <CustomizePage />
          }
        />

        <Route 
          path = "/cart" 
          element={
            <CartPage />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
