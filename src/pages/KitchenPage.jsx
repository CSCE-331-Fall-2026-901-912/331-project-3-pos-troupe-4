import { useState, useEffect } from 'react';
import { getOrderHistory, getOrderProducts } from '../api.js';
import KitchenCard from '../components/KitchenCard.jsx';
import '../page-styles/kitchen-styles.css';

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await getOrderHistory('2026-09-05', '2026-09-05', 10);

        const ordersWithProducts = await Promise.all(
          data.map(async (order) => ({
            ...order,
            products: await getOrderProducts(order.order_id)
          }))
        );

        setOrders(ordersWithProducts);
      } catch (err) {
        console.error('Kitchen page error:', err);
      }
    }

    loadOrders();
  }, []);

  return (
    <div>
      <h2>Kitchen Page</h2>
      <ul>
        {orders.map(order => (
          <li key={order.order_id}>
            <KitchenCard
              receiptNum={order.order_id}
              orderContents={order.products.map(product => product.product_name)}
              notes="None"
              undoFunc={() => {}}
              checkFunc={() => {}}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}