import KitchenCard from '../components/KitchenCard.jsx'

export default function KitchenPage() {
  const testCard = <KitchenCard receiptNum={-1} orderContents="None" notes="None" undoFunc={() => { return; }} checkFunc={() => { return; }}></KitchenCard>;
  return (
    <div>
      <label>Kitchen Page Test</label>
      <p>Test!</p>
      {testCard}
    </div>
  );
}
