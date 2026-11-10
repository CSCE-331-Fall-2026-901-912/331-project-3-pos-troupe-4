import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { placeOrder } from '../api';
import { useCart } from '../components/Cashier/CartHandling';

const CASHIER_ID = 3;

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeItem, clearCart, customerName, subtotal, tax, total } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    const order = {
      employeeId: CASHIER_ID,
      customerName: customerName || 'Guest',
      totalPrice: total,
      items: (items || []).map((item) => ({
        productName: item.productName,
        selectAddOns: (item.addOns || []).map((name) => ({ itemName: name, isAddition: true })),
        finalConstituentItems: [
          ...(item.constituentItems || []).filter((name) => !(item.removed || []).includes(name)),
          ...(item.addOns || []),
        ],
      })),
    };

    setSubmitting(true);
    setError('');
    try {
      const res = await placeOrder(order);
      clearCart();
      navigate('/cashier', { state: { orderId: res?.orderId } });
    } catch (err) {
      console.error('Error submitting order:', err);
      setError('Could not submit the order. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <div className="summary">
      <h2>Order Summary &amp; Confirmation</h2>
      <p className="muted">Customer: {customerName || 'Guest'}</p>

      <div className="summary__list">
        {items.map((item, index) => (
          <div key={index} className="summary__item">
            <div>
              <strong>{item.productName}</strong>
              {item.addOns.length > 0 && (
                <div className="summary__detail">Add-ins: {item.addOns.join(', ')}</div>
              )}
              {item.removed.length > 0 && (
                <div className="summary__detail">Removed: {item.removed.join(', ')}</div>
              )}
              {item.ice && <div className="summary__detail">{item.ice}</div>}
              {item.sugar && <div className="summary__detail">{item.sugar}</div>}
            </div>
            <div>
              ${item.itemTotal.toFixed(2)}{' '}
              <button onClick={() => removeItem(index)}>✕</button>
            </div>
          </div>
        ))}
      </div>

      <div className="summary__end">
        <span>Subtotal: ${subtotal.toFixed(2)}</span>
        <span> Tax: ${tax.toFixed(2)}</span>
        <strong> Grand Total: ${total.toFixed(2)}</strong>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="cashier__actions">
        <button className="btn btn--outline" onClick={() => navigate('/cashier')}>&larr; Back to Order</button>
        <button className="btn btn--primary" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Confirm & Submit Order'}
        </button>
      </div>
    </div>
  );
}
