import { getOrderHistory } from '../.api.js'
import KitchenCard from '../components/KitchenCard.jsx'
import '../page-styles/kitchen-styles.css'

export default function KitchenPage() {
  const testCard = <KitchenCard receiptNum={-1} orderContents={["Taro Milk Tea", "Orange Juice"]} notes="None" undoFunc={() => { return; }} checkFunc={() => { return; }}></KitchenCard>;
  // const activeOrders;
  const pastOrders = getOrderHistory();
  const pastOrdersList = pastOrders.map(order => { return <KitchenCard receiptNum={order.ID} orderContents={ }></KitchenCard> });
  return (
    <div>
      <label>Kitchen Page</label>
    </div>
  );
}
