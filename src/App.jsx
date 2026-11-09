import React, { Component } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles.css';

import ManagerPage from './pages/ManagerPage';
import CashierPage from './pages/CashierPage';
import CustomizePage from './pages/CustomizePage';
import CartPage from './pages/CartPage';
import KioskPage from './pages/KioskMainPage';
import KitchenPage from './pages/KitchenPage';
import RoleSelector from './pages/RoleSelector';
import { CartProvider } from './components/Cashier/CartHandling';
import AccessibilityBar from './components/Cashier/AccessibilityBar';
import EmployeeRoute from './components/EmployeeRoute';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '40px auto', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ color: '#d32f2f' }}>Something went wrong</h2>
          <p style={{ color: '#555' }}>An unexpected error occurred while rendering this page:</p>
          <pre style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', overflowX: 'auto', color: '#c2185b' }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.href = '/'; }}
              style={{ padding: '8px 16px', background: '#1976d2', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Return to Portal Home
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: '8px 16px', background: '#e0e0e0', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <CartProvider>
        <BrowserRouter>
        <AccessibilityBar />
          <Routes>
            <Route path="/" element={<RoleSelector />} />
            <Route path="/kiosk" element={<KioskPage />} />
            <Route
                path="/manager"
                element={
                    <EmployeeRoute managerOnly>
                        <ManagerPage />
                    </EmployeeRoute>
                }
            />

            <Route
                path="/cashier"
                element={
                    <EmployeeRoute>
                        <CashierPage />
                    </EmployeeRoute>
                }
            />

            <Route
                path="/cashier/customize"
                element={
                    <EmployeeRoute>
                        <CustomizePage />
                    </EmployeeRoute>
                }
            />

            <Route
                path="/cashier/cart"
                element={
                    <EmployeeRoute>
                        <CartPage />
                    </EmployeeRoute>
                }
            />

            <Route
                path="/cart"
                element={
                    <EmployeeRoute>
                        <CartPage />
                    </EmployeeRoute>
                }
            />
            <Route path="/cashier/customize" element={<CustomizePage />} />
            <Route path="/cashier/cart" element={<CartPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/kitchen" element={<KitchenPage />} />
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </ErrorBoundary>
  );
}
