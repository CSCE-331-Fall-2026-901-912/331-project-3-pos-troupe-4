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
        // Query the 12 most recent orders across the entire database
        const data = await getOrderHistory(null, null, 12);

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
  }, []);

  function setList() {
    if (!ordersSet) {
      return (Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
        <li key={num} >
          <EmptyCard />
        </li>
      )));
    }
    return orders.map(order => (
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
        <h1 className="kitchen-header-title">Kitchen Orders</h1>
        <div className="badge badge--secondary">
          Live Orders: {orders.length}
        </div>
      </div>
      <ul className="card-list">
        {setList()}
      </ul>
    </div>
  );
}
