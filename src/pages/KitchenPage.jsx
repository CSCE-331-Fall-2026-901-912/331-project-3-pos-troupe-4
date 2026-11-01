import { useState, useEffect } from 'react';
import { getOrderHistory, getOrderProducts } from '../api.js'
import KitchenCard from '../components/KitchenCard.jsx'
import EmptyCard from '../components/EmptyCard.jsx'
import '../page-styles/kitchen-styles.css'

export default function KitchenPage() {
  const [orderHistory, setOrderHistory] = useState('')
  const [kitchenCardOutput, setKitchenCardOutput] = useState(<EmptyCard></EmptyCard>)
  //const testCard = <KitchenCard receiptNum={-1} orderContents={["Taro Milk Tea", "Orange Juice"]} notes="None" undoFunc={() => { return; }} checkFunc={() => { return; }}></KitchenCard>;

  // Allows asynchronous functions to be called in a client function.
  useEffect(() => {
    async function localGetOrderHistory() {
      const data = await getOrderHistory();
      setOrderHistory(data);
    }
    async function getOrderContents() {
      try {
        const order_contents = await getOrderProducts(order.ID)
        const localKitchenCardOutput = orderHistory.map((order) => {
          return <li><KitchenCard receiptNum={order.ID} orderContents={order_contents} notes="None" undoFunc={() => { return; }} checkFunc={() => { return; }}></KitchenCard></li>
        });
        setKitchenCardOutput(localKitchenCardOutput);
      } catch {
        console.error("Failed GET attempt in KitchenPage getOrderContents()");
      }
    }
    if (!orderHistory) {
      localGetOrderHistory();
    }
    else if (!kitchenCardOutput) {
      getOrderContents();
    }
  }, [])
  return (
    <div>
      <label>Kitchen Page</label>
      <ul>{kitchenCardOutput}</ul>
    </div>
  );
}
