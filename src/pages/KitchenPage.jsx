import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrderHistory, getOrderProducts, getOrderAddIns } from '../api.js';
import KitchenCard from '../components/KitchenCard.jsx';
import EmptyCard from '../components/EmptyCard.jsx';
import '../page-styles/kitchen-styles.css';

export default function KitchenPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [ordersSet, setOrderSet] = useState(false);
  const [orderLimit, setOrderLimit] = useState(15);
  const [filterMode, setFilterMode] = useState('live'); // 'live' or 'all'
  const [orderStatuses, setOrderStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem('kitchen_order_statuses');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  function advanceStatus(orderId) {
    const current = orderStatuses[orderId] || 'In Queue';
    let next = 'Preparing';
    if (current === 'In Queue') next = 'Preparing';
    else if (current === 'Preparing') next = 'Ready';
    else if (current === 'Ready') next = 'Completed';
    else if (current === 'Completed') next = 'Completed';

    setOrderStatuses((prev) => {
      const updated = { ...prev, [orderId]: next };
      try { localStorage.setItem('kitchen_order_statuses', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  function revertStatus(orderId) {
    const current = orderStatuses[orderId] || 'In Queue';
    let next = 'In Queue';
    if (current === 'Completed') next = 'Ready';
    else if (current === 'Ready') next = 'Preparing';
    else if (current === 'Preparing') next = 'In Queue';

    setOrderStatuses((prev) => {
      const updated = { ...prev, [orderId]: next };
      try { localStorage.setItem('kitchen_order_statuses', JSON.stringify(updated)); } catch {}
      return updated;
    });
  }

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getOrderHistory(null, null, orderLimit);

        const ordersWithProducts = await Promise.all(
          (data || []).map(async (order) => ({
            ...order,
            products: await getOrderProducts(order.order_id),
            addIns: await getOrderAddIns(order.order_id)
          }))
        );

        setOrders(ordersWithProducts);
        setOrderSet(true);
      } catch (err) {
        console.error('Kitchen page error:', err);
      }
    }

    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [orderLimit]);

  const liveOrders = orders.filter(
    (order) => (orderStatuses[order.order_id] || 'In Queue') !== 'Completed'
  );

  const displayedOrders = filterMode === 'live' ? liveOrders : orders;

  function setList() {
    if (!ordersSet) {
      return (Array.from({ length: 6 }, (_, i) => i + 1).map(num => (
        <li key={num} className='card-list-item'>
          <EmptyCard />
        </li>
      )));
    }

    if (displayedOrders.length === 0) {
      return (
        <li className='card-list-empty' style={{ listStyle: 'none', padding: '3rem 1rem', textAlign: 'center', background: '#ffffff', borderRadius: '10px', border: '1px solid var(--border, #E5ECE6)' }}>
          <span style={{ fontSize: '2.5rem' }}>✓</span>
          <h3 style={{ margin: '0.75rem 0 0.25rem', color: 'var(--primary-color, #2E6F5E)' }}>All Caught Up!</h3>
          <p style={{ color: 'var(--font-muted, #64748b)', margin: 0 }}>
            {filterMode === 'live'
              ? 'No active orders in queue. Click "All Orders" below to view previously completed tickets.'
              : 'No orders found.'}
          </p>
        </li>
      );
    }

    return displayedOrders.map(order => (
      <li key={order.order_id} className='card-list-item'>
        <KitchenCard
          receiptNum={order.order_id}
          orderContents={(order.products || []).map(product => product.product_name)}
          addIns={order.addIns || []}
          status={orderStatuses[order.order_id] || 'In Queue'}
          customerName={order.customer_name}
          timestamp={order.date_time}
          notes="None"
          undoFunc={() => revertStatus(order.order_id)}
          checkFunc={() => advanceStatus(order.order_id)}
        />
      </li>
    ));
  }

  return (
    <div className='kitchen-box'>
      <div className="kitchen-header-box">
        <div>
          <h1 className="kitchen-header-title">Kitchen Orders</h1>
          <p style={{ margin: '4px 0 0', color: 'var(--font-muted, #64748b)', fontSize: '0.9rem' }}>
            Live preparation tickets with custom add-ins
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            type="button"
            className={`btn btn--outline ${filterMode === 'live' ? 'btn--accent' : ''}`}
            onClick={() => setFilterMode('live')}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
          >
            Live Orders ({liveOrders.length})
          </button>
          <button
            type="button"
            className={`btn btn--outline ${filterMode === 'all' ? 'btn--accent' : ''}`}
            onClick={() => setFilterMode('all')}
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
          >
            All Orders ({orders.length})
          </button>
        </div>
      </div>

      <ul className="card-list">
        {setList()}
      </ul>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '2.5rem 0 1rem' }}>
        <button
          type="button"
          className="btn btn--outline"
          onClick={() => setOrderLimit((prev) => prev + 10)}
          style={{ padding: '0.65rem 1.75rem', fontWeight: 600, fontSize: '0.95rem' }}
        >
          ⬇ Load Previous 10 Orders
        </button>
      </div>
    </div>
  );
}
