export default function KitchenCard({
  receiptNum,
  orderContents,
  notes,
  timestamp,
  undoFunc,
  checkFunc
}) {
  const productItems = orderContents.map((product, index) => (
    <li key={index}>{product}</li>
  ));

  return (
    <div className="component">
      <div className="kitchen-card-header">
        <h3>Order #{receiptNum}</h3>
        <span className="order-timestamp">
          {timestamp ? new Date(timestamp).toLocaleString() : ''}
        </span>
      </div>

      <div className="kitchen-card-content">
        <div className="order-products">
          <h4>Order Products</h4>
          <ul className="product-list">
            {productItems}
          </ul>
        </div>

        <div className="kitchen-card-notes">
          <strong>Notes:</strong>
          <p>{notes || 'None'}</p>
        </div>
      </div>

      <div className="kitchen-card-actions">
        <button onClick={undoFunc}>Undo</button>
        <button onClick={checkFunc}>Check</button>
      </div>
    </div>
  );
}