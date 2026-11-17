import React, { useState } from 'react';
import { useCustomerCart, CUSTOMER_ADDON_PRICE } from './CustomerCartContext';
import { placeOrder } from '../../api';
import DrinkIcon from '../Kiosk/DrinkIcon';

export default function CustomerCartDrawer({
  isOpen,
  onClose,
  onEditItem,
  onOrderSuccess,
  isMobile,
  isSimulated
}) {
  const {
    items,
    removeItem,
    clearCart,
    subtotal,
    tax,
    total,
    profile,
    updateProfile,
    addRecentOrder
  } = useCustomerCart();

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [customerName, setCustomerName] = useState(profile.name || '');
  const [customerPhone, setCustomerPhone] = useState(profile.phone || '');
  const [paymentMethod, setPaymentMethod] = useState('apple-pay');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  if (!isOpen) return null;

  // Calculate estimated pickup time (~15 mins from now)
  const estimatedTime = (() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  })();

  async function handlePlaceOrder(e) {
    e.preventDefault();
    if (items.length === 0 || isSubmitting) return;

    const finalName = customerName.trim() || 'Online Guest';

    // Build order object adhering to placeOrder schema
    const orderPayload = {
      employeeId: 0,
      customerName: finalName,
      totalPrice: total,
      items: items.map((item) => ({
        productName: item.productName,
        selectAddOns: (item.addOns || []).map((name) => ({ itemName: name, isAddition: true })),
        finalConstituentItems: [
          ...(item.constituentItems || []).filter((name) => !(item.removed || []).includes(name)),
          ...(item.addOns || [])
        ]
      }))
    };

    setIsSubmitting(true);
    setCheckoutError('');

    try {
      const response = await placeOrder(orderPayload);
      const orderId = response?.orderId || Math.floor(1000 + Math.random() * 9000);

      // Save to customer account history
      addRecentOrder({
        orderId,
        customerName: finalName,
        phone: customerPhone.trim(),
        totalPrice: total,
        itemsSummary: items.map((i) => i.productName).join(', '),
        dateTime: new Date().toISOString(),
        items: [...items]
      });

      // Update customer profile name & phone if not already saved
      updateProfile({
        name: finalName,
        phone: customerPhone.trim()
      });

      clearCart();
      setIsCheckingOut(false);
      onOrderSuccess({
        orderId,
        customerName: finalName,
        total,
        pickupTime: estimatedTime,
        itemsPlaced: [...items]
      });
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutError('Could not process mobile order. Please try again or visit our counter.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={`customer-cart-backdrop ${isMobile ? 'is-mobile-cart-backdrop' : ''} ${isSimulated ? 'is-simulated-backdrop' : ''}`} onClick={onClose}>
      <aside
        className={`customer-cart-panel ${isMobile ? 'is-mobile-cart-panel' : ''}`}
        onClick={(e) => e.stopPropagation()}
        aria-label="Your Bag"
      >
        {/* Cart Header */}
        <div className="cart-panel-header">
          <div className="cart-header-title-wrap">
            <span className="cart-header-icon">🛍️</span>
            <h2>{isCheckingOut ? 'Express Checkout' : 'Your Bag'}</h2>
          </div>
          <button className="cart-close-btn" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        {/* Content Area */}
        <div className="cart-panel-body">
          {!isCheckingOut ? (
            /* Items List View */
            items.length === 0 ? (
              <div className="cart-empty-view">
                <span className="empty-cart-emoji">🧋</span>
                <h3>Your bag is empty</h3>
                <p>Browse our handcrafted drinks and build your perfect order.</p>
                <button className="start-browsing-btn" onClick={onClose}>
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="cart-items-list">
                {items.map((item, idx) => (
                  <div key={idx} className="cart-item-card">
                    <div className="cart-item-thumb">
                      <DrinkIcon name={item.productName} size={44} />
                    </div>
                    <div className="cart-item-info">
                      <div className="cart-item-top">
                        <span className="cart-item-name">{item.productName}</span>
                        <span className="cart-item-price">${Number(item.itemTotal || 0).toFixed(2)}</span>
                      </div>

                      <div className="cart-item-specs">
                        {item.size && <span className="spec-tag">{item.size}</span>}
                        {item.sugar && <span className="spec-tag">{item.sugar}</span>}
                        {item.ice && <span className="spec-tag">{item.ice}</span>}
                      </div>

                      {item.addOns && item.addOns.length > 0 && (
                        <div className="cart-item-addons">
                          + {item.addOns.join(', ')}
                        </div>
                      )}

                      {item.notes && (
                        <div className="cart-item-notes">
                          <em>Note:</em> {item.notes}
                        </div>
                      )}

                      <div className="cart-item-actions">
                        <button
                          type="button"
                          className="cart-action-link"
                          onClick={() => {
                            onEditItem(item, idx);
                            onClose();
                          }}
                        >
                          Modify
                        </button>
                        <span className="cart-action-sep">•</span>
                        <button
                          type="button"
                          className="cart-action-link text-danger"
                          onClick={() => removeItem(idx)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* Checkout Step Form */
            <form id="checkout-form" className="checkout-step-form" onSubmit={handlePlaceOrder}>
              {checkoutError && (
                <div className="checkout-error-banner" role="alert">
                  ⚠️ {checkoutError}
                </div>
              )}

              {/* Pickup Time Estimate Notice */}
              <div className="pickup-banner">
                <span className="pickup-icon">⏱️</span>
                <div>
                  <strong>Estimated Pickup: ~15 mins</strong>
                  <p>Ready around {estimatedTime} at the front counter.</p>
                </div>
              </div>

              {/* Customer Contact Information */}
              <div className="checkout-section">
                <label className="checkout-label" htmlFor="checkout-customer-name">
                  Name for Order <span className="required">*</span>
                </label>
                <input
                  id="checkout-customer-name"
                  type="text"
                  required
                  placeholder="E.g., Alex Smith"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="checkout-input"
                  maxLength={50}
                />
              </div>

              <div className="checkout-section">
                <label className="checkout-label" htmlFor="checkout-customer-phone">
                  Mobile Number (for Ready SMS)
                </label>
                <input
                  id="checkout-customer-phone"
                  type="tel"
                  placeholder="(555) 000-0000"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="checkout-input"
                />
              </div>

              {/* Payment Methods */}
              <div className="checkout-section">
                <label className="checkout-label">Select Payment</label>
                <div className="payment-options">
                  <label className={`payment-pill ${paymentMethod === 'apple-pay' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="apple-pay"
                      checked={paymentMethod === 'apple-pay'}
                      onChange={() => setPaymentMethod('apple-pay')}
                    />
                    <span className="payment-text">🍎 Apple Pay / Google Pay</span>
                  </label>

                  <label className={`payment-pill ${paymentMethod === 'card' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={() => setPaymentMethod('card')}
                    />
                    <span className="payment-text">💳 Credit / Debit Card</span>
                  </label>

                  <label className={`payment-pill ${paymentMethod === 'counter' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="counter"
                      checked={paymentMethod === 'counter'}
                      onChange={() => setPaymentMethod('counter')}
                    />
                    <span className="payment-text">🏪 Pay at Store Pickup</span>
                  </label>
                </div>

                {paymentMethod === 'card' && (
                  <div className="mock-card-box">
                    <input type="text" placeholder="Card number: •••• •••• •••• 4242" disabled value="•••• •••• •••• 4242" className="mock-card-input" />
                    <div className="mock-card-row">
                      <input type="text" placeholder="MM/YY" disabled value="12/28" className="mock-card-input" />
                      <input type="text" placeholder="CVC" disabled value="888" className="mock-card-input" />
                    </div>
                    <span className="mock-badge">Mock Secure Checkout Sandbox</span>
                  </div>
                )}
              </div>
            </form>
          )}
        </div>

        {/* Cart / Checkout Footer */}
        {items.length > 0 && (
          <div className="cart-panel-footer">
            <div className="cart-totals-breakdown">
              <div className="totals-row">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="totals-row">
                <span>Estimated Tax (8.25%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="totals-row grand-total">
                <strong>Total Due</strong>
                <strong className="grand-price">${total.toFixed(2)}</strong>
              </div>
            </div>

            {!isCheckingOut ? (
              <button
                type="button"
                className="cart-checkout-proceed-btn"
                onClick={() => setIsCheckingOut(true)}
              >
                Proceed to Checkout →
              </button>
            ) : (
              <div className="checkout-actions-row">
                <button
                  type="button"
                  className="back-to-bag-btn"
                  onClick={() => setIsCheckingOut(false)}
                  disabled={isSubmitting}
                >
                  ← Back to Bag
                </button>
                <button
                  type="submit"
                  form="checkout-form"
                  className="submit-order-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Placing Order...' : `Pay $${total.toFixed(2)}`}
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}
