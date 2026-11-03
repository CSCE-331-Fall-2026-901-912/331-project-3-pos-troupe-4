import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrderHistory, getOrderProducts } from '../api.js';
import KitchenCard from '../components/KitchenCard.jsx';
import EmptyCard from '../components/EmptyCard.jsx';
import '../page-styles/kitchen-styles.css';

export default function KitchenPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [ordersSet, setOrderSet] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        // Query the 9 most recent orders across the entire database
        const data = await getOrderHistory(null, null, 9);

        const ordersWithProducts = await Promise.all(
          (data || []).map(async (order) => ({
            ...order,
            products: await getOrderProducts(order.order_id)
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
      return (Array.from({ length: 9 }, (_, i) => i + 1).map(num => (
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
          timestamp={order.date_time}
          notes="None"
          undoFunc={() => { }}
          checkFunc={() => { }}
        />
      </li>
    ));
  }

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          ← Portal
        </button>
        <h2 style={{ margin: 0 }}>Kitchen Orders (Most Recent)</h2>
      </div>
      <ul className="card-list">
        {setList()}
      </ul>
    </div>
  );
}
