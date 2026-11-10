import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../page-styles/KioskMainPage.css';
import { getMenuItems } from '../api';
import { useKioskCart, ADDON_PRICE } from '../components/Kiosk/KioskCartHandling';
import CustomizationScreen from '../components/Kiosk/KioskCustomization';
import CheckoutScreen from '../components/Kiosk/KioskCheckout';
import DrinkIcon from '../components/Kiosk/DrinkIcon';

export default function KioskPage() {
  const navigate = useNavigate();
  const { items, addItem, updateItem, subtotal } = useKioskCart();
  const [menuItems, setMenuItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [initialCustomization, setInitialCustomization] = useState(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState(null);

  // Sorting & Filtering state
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadMenu() {
      try {
        const data = await getMenuItems();
        if (!cancelled) setMenuItems(data || []);
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
    const timer = setTimeout(() => {
      setOrderConfirmed(false);
      setConfirmedOrderId(null);
    }, 20000);
    return () => clearTimeout(timer);
  }, [orderConfirmed]);

  function handleAddToCart(cartItem) {
    if (editingIndex !== null) {
      updateItem(editingIndex, cartItem);
      setEditingIndex(null);
      setInitialCustomization(null);
      setSelectedItem(null);
      setShowCheckout(true);
    } else {
      addItem(cartItem);
      setSelectedItem(null);
    }
  }

  // Filter & Sort Logic
  const processedMenu = useMemo(() => {
    let result = [...menuItems];

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(item => item.name.toLowerCase().includes(q));
    }

    // Filter by category
    if (category === 'milk-tea') {
      result = result.filter(item => /milk\s*tea|pearl/i.test(item.name));
    } else if (category === 'fruit-tea') {
      result = result.filter(item => /green|peach|mango|burst|lychee|berry|lemonade/i.test(item.name) && !/milk/i.test(item.name));
    } else if (category === 'specialty') {
      result = result.filter(item => /coffee|chai|creama|honey\s*tea|caramel/i.test(item.name));
    }

    // Sort
    if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === 'price-asc') {
      result.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => Number(b.price) - Number(a.price));
    }

    return result;
  }, [menuItems, category, sortBy, search]);

  if (loading) return <p className="kiosk-loading">Loading menu...</p>;
  if (error) return <p className="kiosk-error">Couldn't load the menu.</p>;

  if (orderConfirmed) {
    return (
      <main className="kiosk-container kiosk-confirmed-screen">
        <div className="confirmed-card">
          <div className="confirmed-icon">✓</div>
          <h2>Thank you! Your order has been placed.</h2>
          <div className="order-number-banner">
            <span className="order-number-label">Your Order Number</span>
            <span className="order-number-val">#{confirmedOrderId || '---'}</span>
          </div>
          <p className="confirmed-desc">
            Please watch the pickup counter. Your drink is being prepared now!
          </p>
          <button
            className="checkout-button confirm"
            onClick={() => {
              setOrderConfirmed(false);
              setConfirmedOrderId(null);
            }}
          >
            Start a New Order
          </button>
        </div>
      </main>
    );
  }

  if (selectedItem) {
    return (
      <CustomizationScreen
        item={selectedItem}
        initialCustomization={initialCustomization}
        onCancel={() => {
          setSelectedItem(null);
          setInitialCustomization(null);
          if (editingIndex !== null) {
            setEditingIndex(null);
            setShowCheckout(true);
          }
        }}
        onConfirm={handleAddToCart}
      />
    );
  }

  if (showCheckout) {
    return (
      <CheckoutScreen
        onBack={() => setShowCheckout(false)}
        onModify={(item, index) => {
          const menuItem = menuItems.find((m) => m.name === item.productName) || {
            name: item.productName,
            price: (Number(item.itemTotal) || 0) - (item.addOns?.length || 0) * ADDON_PRICE,
            constituentItems: item.constituentItems || [],
          };
          setSelectedItem(menuItem);
          setInitialCustomization(item);
          setEditingIndex(index);
          setShowCheckout(false);
        }}
        onDone={(orderId) => {
          setShowCheckout(false);
          setConfirmedOrderId(orderId);
          setOrderConfirmed(true);
        }}
      />
    );
  }

  return (
    <main className="kiosk-container">
      <header className="kiosk-header">
        <div>
          <h1>Build your drink.</h1>
          <p>Choose an item to get started.</p>
        </div>

        {/* Search & Sort / Filter Bar */}
        <div className="kiosk-controls">
          <div className="kiosk-search-wrap">
            <input
              type="text"
              placeholder="Search drinks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="kiosk-search-input"
            />
            {search && (
              <button className="kiosk-clear-btn" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <div className="kiosk-category-tabs">
            <button
              className={`kiosk-tab ${category === 'all' ? 'active' : ''}`}
              onClick={() => setCategory('all')}
            >
              All Drinks
            </button>
            <button
              className={`kiosk-tab ${category === 'milk-tea' ? 'active' : ''}`}
              onClick={() => setCategory('milk-tea')}
            >
              Milk Teas
            </button>
            <button
              className={`kiosk-tab ${category === 'fruit-tea' ? 'active' : ''}`}
              onClick={() => setCategory('fruit-tea')}
            >
              Fruit & Green Teas
            </button>
            <button
              className={`kiosk-tab ${category === 'specialty' ? 'active' : ''}`}
              onClick={() => setCategory('specialty')}
            >
              Specialties
            </button>
          </div>

          <div className="kiosk-sort-wrap">
            <label htmlFor="kiosk-sort">Sort by:</label>
            <select
              id="kiosk-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="kiosk-sort-select"
            >
              <option value="default">Featured</option>
              <option value="name-asc">Name (A → Z)</option>
              <option value="name-desc">Name (Z → A)</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
        </div>
      </header>

      <div className="menu-grid">
        {processedMenu.map((item) => (
          <button
            key={item.id ?? item.name}
            className="kiosk-button"
            onClick={() => setSelectedItem(item)}
          >
            <div className="kiosk-drink-icon-wrap">
              <DrinkIcon name={item.name} size={68} />
            </div>
            <span className="name">{item.name}</span>
            <span className="price">${Number(item.price).toFixed(2)}</span>
            <span className="kiosk-card-action">Tap to Customize</span>
          </button>
        ))}
        {processedMenu.length === 0 && (
          <div className="kiosk-no-results">
            <p>No drinks matched your selection.</p>
            <button onClick={() => { setSearch(''); setCategory('all'); }} className="kiosk-reset-btn">
              Reset Filters
            </button>
          </div>
        )}
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
