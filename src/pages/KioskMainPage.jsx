import { useEffect, useState } from 'react';
import '../page-styles/KioskMainPage.css';
import { getMenuItems, placeOrder } from '../api';
import { useCart } from '../components/Cashier/CartHandling';
import CustomizationScreen from '../components/Kiosk/KioskCustomization';
import CheckoutScreen from '../components/Kiosk/KioskCheckout'


export default function KioskPage() {
  const { items, addItem, subtotal } = useCart();
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      try {
        const data = await getMenuItems();
        if (!cancelled) setMenuItems(data);
      } catch (err) {
        console.error('Error loading menu:', err);
        if (!cancelled) setError("Couldn't load the menu");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadMenu();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!orderConfirmed) return;
    const timer = setTimeout(() => setOrderConfirmed(false), 20000);
    return () => clearTimeout(timer);
  }, [orderConfirmed]);

  function handleAddToCart(cartItem) {
    addItem(cartItem);
    setSelectedItem(null);
  }

  if (loading) return <p>Loading menu</p>
  if (error) return <p className='kiosk-error'>Couldn't load the menu.</p>

  if (orderConfirmed) {
    return (
      <main className="kiosk-container">
        <h2>Thank you! Your order has been placed.</h2>
        <button className="checkout-button" onClick={() => setOrderConfirmed(false)}>
          Start a new order
        </button>
      </main>
    );
  }

  if (selectedItem) {
    return (
      <CustomizationScreen
        item={selectedItem}
        onCancel={() => setSelectedItem(null)}
        onConfirm={handleAddToCart}
      />
    );
  }

  if (showCheckout) {
    return (
      <CheckoutScreen
        onBack={() => setShowCheckout(false)}
        onDone={() => {
          setShowCheckout(false);
          setOrderConfirmed(true);
        }}
      />
    )
  }

  return (
    <main className="kiosk-container">
      <header className="kiosk-header">
        <div>
          <h1>Build your drink.</h1>
          <p>Choose an item to get started.</p>
        </div>
      </header>

      <div className="menu-grid">
        {menuItems.map((item) => (
          <button
            key={item.id ?? item.name}
            className="kiosk-button"
            onClick={() => setSelectedItem(item)}
          >
            <span className="name">{item.name}</span>
            <span className="price">
              ${Number(item.price).toFixed(2)}
            </span>
          </button>
        ))}
      </div>

      <footer className="order-bar">
        <div className="order-summary">
          <span className="order-count">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
          <span className="order-subtotal">
            Subtotal: ${subtotal.toFixed(2)}
          </span>
        </div>

        <button
          className="checkout-button"
          onClick={() => setShowCheckout(true)}
          disabled={items.length === 0}
        >
          View order →
        </button>
      </footer>
    </main>
  );
}
