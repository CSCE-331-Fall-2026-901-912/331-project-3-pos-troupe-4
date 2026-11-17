import React, { useState, useEffect } from 'react';
import { useCustomerCart } from './CustomerCartContext';
import { getCustomerOrders } from '../../api';

export default function CustomerProfileModal({ isOpen, onClose, onSelectDrink, isMobile }) {
  const { profile, updateProfile, reorder } = useCustomerCart();
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' or 'profile'
  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [email, setEmail] = useState(profile.email || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [dbOrders, setDbOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  useEffect(() => {
    if (isOpen && profile.name) {
      let active = true;
      setLoadingOrders(true);
      getCustomerOrders(profile.name)
        .then((orders) => {
          if (active) setDbOrders(orders || []);
        })
        .catch((err) => console.warn('Could not load DB orders:', err))
        .finally(() => {
          if (active) setLoadingOrders(false);
        });
      return () => { active = false; };
    }
  }, [isOpen, profile.name]);

  if (!isOpen) return null;

  function handleSaveProfile(e) {
    e.preventDefault();
    updateProfile({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim()
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  }

  function handleReorderLocal(order) {
    if (order?.items && order.items.length > 0) {
      reorder(order.items);
      onClose();
    }
  }

  // Combine local detailed orders and DB historical records
  const localOrders = profile.recentOrders || [];

  return (
    <div className={`customer-modal-backdrop ${isMobile ? 'is-mobile-backdrop' : ''}`} onClick={onClose}>
      <div
        className={`customer-profile-card ${isMobile ? 'is-mobile-sheet' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        {/* Header */}
        <div className="profile-modal-header">
          <div className="profile-header-user">
            <span className="profile-avatar">👤</span>
            <div>
              <h2 id="profile-modal-title">{profile.name || 'Customer Account'}</h2>
              <span className="profile-subtitle">Troupe 04 Rewards &amp; Order History</span>
            </div>
          </div>
          <button className="custom-modal-close" onClick={onClose} aria-label="Close profile">✕</button>
        </div>

        {/* Tab Switcher */}
        <div className="profile-tabs-bar">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            📋 Past Orders ({localOrders.length || dbOrders.length})
          </button>
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            ⚙️ Account Details
          </button>
        </div>

        {/* Tab Body */}
        <div className="profile-modal-body">
          {activeTab === 'orders' ? (
            <div className="profile-orders-list">
              {localOrders.length === 0 && dbOrders.length === 0 ? (
                <div className="profile-empty-orders">
                  <span className="empty-orders-emoji">🧾</span>
                  <h4>No past orders yet</h4>
                  <p>When you order ahead, your receipts and favorite items will be saved here for instant reordering.</p>
                </div>
              ) : (
                <>
                  {localOrders.map((ord, idx) => (
                    <div key={`local-${idx}`} className="profile-order-card">
                      <div className="order-card-header">
                        <span className="order-card-number">Order #{ord.orderId}</span>
                        <span className="order-card-date">
                          {ord.dateTime ? new Date(ord.dateTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </span>
                      </div>

                      <p className="order-card-summary">
                        <strong>Items:</strong> {ord.itemsSummary || (ord.items || []).map((i) => i.productName).join(', ')}
                      </p>

                      <div className="order-card-footer">
                        <span className="order-card-total">Total: ${Number(ord.totalPrice || 0).toFixed(2)}</span>
                        {ord.items && ord.items.length > 0 && (
                          <button
                            type="button"
                            className="reorder-btn"
                            onClick={() => handleReorderLocal(ord)}
                          >
                            🔄 Reorder All
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Any DB records not matching local */}
                  {dbOrders.filter((dbo) => !localOrders.some((lo) => lo.orderId === dbo.order_id)).map((dbo) => (
                    <div key={`db-${dbo.order_id}`} className="profile-order-card">
                      <div className="order-card-header">
                        <span className="order-card-number">Order #{dbo.order_id}</span>
                        <span className="order-card-date">
                          {new Date(dbo.date_time).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="order-card-summary">Customer: {dbo.customer_name}</p>
                      <div className="order-card-footer">
                        <span className="order-card-total">Total: ${Number(dbo.total_price || 0).toFixed(2)}</span>
                        <span className="past-order-tag">Verified POS Record</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          ) : (
            <form className="profile-edit-form" onSubmit={handleSaveProfile}>
              {saveSuccess && (
                <div className="profile-save-banner">
                  ✓ Profile preferences saved!
                </div>
              )}

              <div className="profile-field-group">
                <label htmlFor="acc-name">Full Name</label>
                <input
                  id="acc-name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="profile-input"
                  maxLength={50}
                />
              </div>

              <div className="profile-field-group">
                <label htmlFor="acc-phone">Mobile Phone</label>
                <input
                  id="acc-phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="profile-input"
                />
              </div>

              <div className="profile-field-group">
                <label htmlFor="acc-email">Email Address</label>
                <input
                  id="acc-email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="profile-input"
                />
              </div>

              <button type="submit" className="save-profile-btn">
                Save Account Information
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
