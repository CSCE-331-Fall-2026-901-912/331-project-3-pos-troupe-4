import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getMenuItems } from '../api';
import ProductSlot from '../components/Cashier/ProductSlot';
import { useCart } from '../components/Cashier/CartHandling';
import '../page-styles/Cashier.css';
import '../styles.css';


export default function CashierPage() {
  const [menu, setMenu] = useState([]);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const [placedOrderId, setPlacedOrderId] = useState(location.state?.orderId || null);
  const { items, removeItem, clearCart, customerName, setCustomerName, subtotal, tax, total } = useCart();

  useEffect(() => {
    if (location.state?.orderId) {
      setPlacedOrderId(location.state.orderId);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    async function loadMenu() {
      try {
        const data = await getMenuItems();
        setMenu(data);
      } catch (error) {
        console.error('Error loading menu: ', error);
      }
    }
    loadMenu();
  }, []);

  //search box
  const shown = menu.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(product) {
    navigate('/cashier/customize', { state: { product: product } });
  }


  return (
    <div className="cashier">
      <section className="cashier__left">
        {placedOrderId && (
          <div className="cashier__order-success">
            <span>✓ Order <strong>#{placedOrderId}</strong> placed successfully!</span>
            <button type="button" onClick={() => setPlacedOrderId(null)}>✕</button>
          </div>
        )}
        <input
          className="cashier__search"
          placeholder="Search menu items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div className="cashier__grid">
          {shown.map((product) => (
            <ProductSlot key={product.name} product={product} OnSelect={handleSelect} />
          ))}
        </div>
      </section>

      <aside className="cashier__order">
        <h3>Current Order</h3>
        <label>
          Customer:{' '}
          <input
            value={customerName}
            placeholder="Guest"
            onChange={(e) => setCustomerName(e.target.value)}
          />
        </label>

        <div className="cashier__cart">
          {(!items || items.length === 0) ? (
            <p className="none"> Cart is Empty. <br /> Click drinks to customize.</p>
          ) : (
            items.map((item, index) => (
              <div key={index} className="cashier__cart-item">
                <div className="cashier__cart-item-header">
                  <span className="cashier__cart-item-name">{item.productName}</span>
                  <span className="cashier__cart-item-price">${(item.itemTotal || 0).toFixed(2)}</span>
                  <button
                    type="button"
                    className="cashier__cart-remove-btn"
                    onClick={() => removeItem(index)}
                    title="Remove item"
                    aria-label={`Remove ${item.productName}`}
                  >
                    ✕
                  </button>
                </div>
                {((item.addOns && item.addOns.length > 0) || (item.removed && item.removed.length > 0) || item.ice || item.sugar) && (
                  <div className="cashier__cart-item-customizations">
                    {item.addOns && item.addOns.length > 0 && (
                      <div className="cashier__cart-custom-line">+ {item.addOns.join(', ')}</div>
                    )}
                    {item.ice && <div className="cashier__cart-custom-line">{item.ice}</div>}
                    {item.sugar && <div className="cashier__cart-custom-line">{item.sugar}</div>}
                    {item.removed && item.removed.length > 0 && (
                      <div className="cashier__cart-custom-line cashier__cart-custom-line--omitted">No {item.removed.join(', ')}</div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        <div className="cashier__totals">
          <div><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
          <div><span>Tax (8.25%):</span> <span> ${tax.toFixed(2)}</span></div>
          <div className="cashier__grand"><span>Total:</span><span>${total.toFixed(2)}</span>

          </div>
        </div>

        <div className="cashier__actions">
          <button className="btn btn--danger" onClick={clearCart}>Clear</button>
          <button className="btn btn--green" onClick={() => navigate('/cashier/cart')}>
            Review &amp; Checkout
          </button>
        </div>

      </aside>

    </div>

  );
}
