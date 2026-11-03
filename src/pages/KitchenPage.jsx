import { useState, useEffect } from 'react';
import { getOrderHistory, getOrderProducts } from '../api.js';
import KitchenCard from '../components/KitchenCard.jsx';
import EmptyCard from '../components/EmptyCard.jsx';
import '../page-styles/kitchen-styles.css';

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [ordersSet, setOrderSet] = useState(false);
  useEffect(() => {
    async function loadOrders() {
      try {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
        const yyyy = today.getFullYear();
        const data = await getOrderHistory(yyyy + '-' + mm + '-' + dd, yyyy + '-' + mm + '-' + dd, 9);

        const ordersWithProducts = await Promise.all(
          data.map(async (order) => ({
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
  }, []);

  function setList() {
    if (!ordersSet) {

      return (Array.from({ length: 9 }, (_, i) => i + 1).map(num => (
        <li key={num} >
          {EmptyCard()}
        </li>
      )))
    }
    return orders.map(order => (
      <li key={order.order_id} className='card-list-item'>
        <KitchenCard
          receiptNum={order.order_id}
          orderContents={order.products.map(product => product.product_name)}
          notes="None"
          undoFunc={() => { }}
          checkFunc={() => { }}
        />
      </li>
    ))
  }

  return (
    <div>
      <h2>Kitchen Page</h2>
      <ul className="card-list">
        {setList()}
      </ul>
    </div>
  );
}
