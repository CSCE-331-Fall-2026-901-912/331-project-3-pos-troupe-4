import React, { useState, useEffect, useMemo } from 'react';
import { getMenuItems } from '../../api';
import { useCustomerCart } from './CustomerCartContext';
import DrinkIcon from '../Kiosk/DrinkIcon';
import CustomerCustomizationModal from './CustomerCustomizationModal';
import CustomerCartDrawer from './CustomerCartDrawer';
import CustomerProfileModal from './CustomerProfileModal';
import './CustomerOrderView.css';

export default function CustomerOrderView({ isMobile = false }) {
  const {
    items,
    addItem,
    updateItem,
    totalItemCount,
    subtotal,
    profile,
    toggleFavorite
  } = useCustomerCart();

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering & Sorting
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('default');

  // Modals state
  const [customizingItem, setCustomizingItem] = useState(null);
  const [editingCartIndex, setEditingCartIndex] = useState(null);
  const [initialCustomData, setInitialCustomData] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Order Confirmed State
  const [lastOrderPlaced, setLastOrderPlaced] = useState(null);

  useEffect(() => {
    let active = true;
    async function fetchMenu() {
      try {
        const data = await getMenuItems();
        if (active) setMenuItems(data || []);
      } catch (err) {
        console.error('Menu load error:', err);
        if (active) setError('Could not load current drink menu.');
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchMenu();
    return () => { active = false; };
  }, []);

  // Filter & Sort Logic
  const filteredMenu = useMemo(() => {
    let result = [...menuItems];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => item.name.toLowerCase().includes(q));
    }

    if (activeCategory === 'favorites') {
      result = result.filter((item) => profile.favorites?.includes(item.name));
    } else if (activeCategory === 'milk-tea') {
      result = result.filter((item) => /milk\s*tea|pearl/i.test(item.name));
    } else if (activeCategory === 'fruit-tea') {
      result = result.filter((item) => /green|peach|mango|burst|lychee|berry|lemonade/i.test(item.name) && !/milk/i.test(item.name));
    } else if (activeCategory === 'specialty') {
      result = result.filter((item) => /coffee|chai|creama|honey\s*tea|caramel/i.test(item.name));
    }

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
  }, [menuItems, activeCategory, searchQuery, sortBy, profile.favorites]);

  function handleStartCustomize(drinkItem) {
    setCustomizingItem(drinkItem);
    setInitialCustomData(null);
    setEditingCartIndex(null);
  }

  function handleEditCartItem(cartItem, index) {
    const rawMenu = menuItems.find((m) => m.name === cartItem.productName) || {
      name: cartItem.productName,
      price: cartItem.basePrice || cartItem.itemTotal,
      constituentItems: cartItem.constituentItems || []
    };
    setCustomizingItem(rawMenu);
    setInitialCustomData(cartItem);
    setEditingCartIndex(index);
  }

  function handleSaveCustomization(customizedPayload) {
    if (editingCartIndex !== null) {
      updateItem(editingCartIndex, customizedPayload);
      setEditingCartIndex(null);
      setIsCartOpen(true);
    } else {
      addItem(customizedPayload);
    }
    setCustomizingItem(null);
    setInitialCustomData(null);
  }

  return (
    <div className={`customer-order-root ${isMobile ? 'is-mobile-view' : 'is-desktop-view'}`}>
      {/* Brand Header */}
      <header className="customer-nav-header">
        <div className="nav-brand-wrap">
          <span className="brand-logo-icon">🧋</span>
          <div>
            <h1 className="brand-heading">Troupe 04 Boba</h1>
            <span className="brand-sub">Handcrafted · Online Ordering</span>
          </div>
        </div>

        <div className="nav-actions-wrap">
          <button
            type="button"
            className="nav-profile-btn"
            onClick={() => setIsProfileOpen(true)}
            aria-label="Customer Profile & Past Orders"
          >
            <span className="profile-btn-icon">👤</span>
            <span className="profile-btn-name">
              {profile.name ? profile.name.split(' ')[0] : 'My Account'}
            </span>
          </button>

          <button
            type="button"
            className="nav-cart-btn"
            onClick={() => setIsCartOpen(true)}
            aria-label="View Shopping Bag"
          >
            <span className="cart-btn-icon">🛍️</span>
            {totalItemCount > 0 && (
              <span className="cart-badge-count">{totalItemCount}</span>
            )}
            {!isMobile && (
              <span className="cart-btn-subtotal">${subtotal.toFixed(2)}</span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="customer-main-content">
        {/* Order Confirmation Screen */}
        {lastOrderPlaced ? (
          <section className="customer-confirmed-screen">
            <div className="confirmed-badge-icon">✓</div>
            <h2 className="confirmed-title">Order Received!</h2>
            <p className="confirmed-tagline">
              Thanks <strong>{lastOrderPlaced.customerName}</strong>, our baristas are preparing your drink fresh.
            </p>

            <div className="confirmed-ticket-card">
              <div className="ticket-header-row">
                <span className="ticket-label">Order Number</span>
                <span className="ticket-id">#{lastOrderPlaced.orderId}</span>
              </div>
              <div className="ticket-pickup-row">
                <span className="pickup-tag-title">Estimated Pickup Time</span>
                <span className="pickup-tag-time">{lastOrderPlaced.pickupTime}</span>
              </div>
              <div className="ticket-items-list">
                {lastOrderPlaced.itemsPlaced?.map((item, i) => (
                  <div key={i} className="ticket-item-row">
                    <span>1× {item.productName} ({item.size})</span>
                    <span>${Number(item.itemTotal || 0).toFixed(2)}</span>
                  </div>
                ))}
                <div className="ticket-total-row">
                  <strong>Total Paid</strong>
                  <strong>${Number(lastOrderPlaced.total || 0).toFixed(2)}</strong>
                </div>
              </div>

              {/* Live Status Tracker */}
              <div className="order-live-tracker">
                <div className="tracker-step completed">
                  <span className="step-circle">✓</span>
                  <span className="step-label">Received</span>
                </div>
                <div className="tracker-line active" />
                <div className="tracker-step in-progress">
                  <span className="step-circle">🍳</span>
                  <span className="step-label">Brewing</span>
                </div>
                <div className="tracker-line" />
                <div className="tracker-step">
                  <span className="step-circle">🛍️</span>
                  <span className="step-label">Counter Pickup</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="new-order-btn"
              onClick={() => setLastOrderPlaced(null)}
            >
              Order Another Drink
            </button>
          </section>
        ) : (
          <>
            {/* Promo Banner */}
            <section className="customer-promo-banner">
              <div className="promo-text-wrap">
                <span className="promo-pill">⚡ Order Ahead Online</span>
                <h2>Skip the Line &amp; Pick Up Fast</h2>
                <p>Customize sweetness, ice, and premium toppings with instant counter pickup.</p>
              </div>
            </section>

            {/* Search & Categories Bar */}
            <div className="customer-filter-toolbar">
              <div className="customer-search-input-wrap">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search boba, matcha, teas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="customer-search-input"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={() => setSearchQuery('')}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="customer-categories-scroll">
                <button
                  type="button"
                  className={`category-pill ${activeCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('all')}
                >
                  All Drinks
                </button>
                <button
                  type="button"
                  className={`category-pill ${activeCategory === 'milk-tea' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('milk-tea')}
                >
                  🧋 Milk Teas
                </button>
                <button
                  type="button"
                  className={`category-pill ${activeCategory === 'fruit-tea' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('fruit-tea')}
                >
                  🍓 Fruit &amp; Green
                </button>
                <button
                  type="button"
                  className={`category-pill ${activeCategory === 'specialty' ? 'active' : ''}`}
                  onClick={() => setActiveCategory('specialty')}
                >
                  ☕ Specialties
                </button>
                {profile.favorites && profile.favorites.length > 0 && (
                  <button
                    type="button"
                    className={`category-pill ${activeCategory === 'favorites' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('favorites')}
                  >
                    ❤️ Favorites ({profile.favorites.length})
                  </button>
                )}
              </div>

              <div className="customer-sort-wrap">
                <label htmlFor="customer-sort-select">Sort:</label>
                <select
                  id="customer-sort-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="customer-sort-dropdown"
                >
                  <option value="default">Featured</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="name-asc">Name (A → Z)</option>
                  <option value="name-desc">Name (Z → A)</option>
                </select>
              </div>
            </div>

            {/* Menu Grid */}
            {loading ? (
              <div className="customer-loading-grid">
                <p>Brewing our drink list...</p>
              </div>
            ) : error ? (
              <div className="customer-error-grid">
                <p>{error}</p>
              </div>
            ) : (
              <div className="customer-drinks-grid">
                {filteredMenu.map((drink) => {
                  const isFav = profile.favorites?.includes(drink.name);
                  return (
                    <article key={drink.id || drink.name} className="drink-card">
                      <button
                        type="button"
                        className={`drink-fav-heart ${isFav ? 'is-fav' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(drink.name);
                        }}
                        title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                        aria-label={`Favorite ${drink.name}`}
                      >
                        {isFav ? '❤️' : '🤍'}
                      </button>

                      <div className="drink-card-visual" onClick={() => handleStartCustomize(drink)}>
                        <DrinkIcon name={drink.name} size={isMobile ? 54 : 68} />
                      </div>

                      <div className="drink-card-body" onClick={() => handleStartCustomize(drink)}>
                        <h3 className="drink-card-name">{drink.name}</h3>
                        <span className="drink-card-price">${Number(drink.price).toFixed(2)}</span>
                      </div>

                      <button
                        type="button"
                        className="drink-card-add-btn"
                        onClick={() => handleStartCustomize(drink)}
                      >
                        Customize &amp; Add
                      </button>
                    </article>
                  );
                })}

                {filteredMenu.length === 0 && (
                  <div className="no-drinks-fallback">
                    <p>No drinks found matching your selection.</p>
                    <button
                      type="button"
                      className="reset-filters-btn"
                      onClick={() => {
                        setSearchQuery('');
                        setActiveCategory('all');
                      }}
                    >
                      Show All Drinks
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Mobile Sticky Floating Bag Bar */}
      {isMobile && totalItemCount > 0 && !lastOrderPlaced && (
        <aside className="mobile-floating-cart-bar" aria-label="Cart Summary Bar">
          <div className="floating-cart-info">
            <span className="floating-cart-count">{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'}</span>
            <span className="floating-cart-total">${subtotal.toFixed(2)}</span>
          </div>
          <button
            type="button"
            className="floating-cart-btn"
            onClick={() => setIsCartOpen(true)}
          >
            View Bag →
          </button>
        </aside>
      )}

      {/* Modals & Drawers */}
      {customizingItem && (
        <CustomerCustomizationModal
          item={customizingItem}
          initialData={initialCustomData}
          onClose={() => {
            setCustomizingItem(null);
            setInitialCustomData(null);
            setEditingCartIndex(null);
          }}
          onConfirm={handleSaveCustomization}
          isMobile={isMobile}
        />
      )}

      <CustomerCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onEditItem={handleEditCartItem}
        onOrderSuccess={(orderData) => {
          setIsCartOpen(false);
          setLastOrderPlaced(orderData);
        }}
        isMobile={isMobile}
      />

      <CustomerProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        isMobile={isMobile}
      />
    </div>
  );
}
