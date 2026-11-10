export default function KitchenCard({
  receiptNum,
  orderContents,
  addIns = [],
  status = 'In Queue',
  customerName,
  notes,
  timestamp,
  undoFunc,
  checkFunc
}) {
  const productItems = (orderContents || []).map((product, index) => (
    <li key={index} className="kitchen-product-name">{product}</li>
  ));

  const statusClass = `status--${status.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className={`component kitchen-card ${statusClass}`}>
      <div className="kitchen-card-header">
        <div>
          <h3>Order #{receiptNum}</h3>
          {customerName && <span className="kitchen-customer-name">Customer: {customerName}</span>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
          <span className={`kitchen-status-badge ${statusClass}`}>{status}</span>
          <span className="order-timestamp">
            {timestamp ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>
      </div>

      <div className="kitchen-card-content">
        <div className="order-products">
          <h4>Items to Prepare</h4>
          <ul className="product-list">
            {productItems.length > 0 ? productItems : <li>Custom Order</li>}
          </ul>
        </div>

        {addIns && addIns.length > 0 && (
          <div className="kitchen-card-addins">
            <h4>Add-ins &amp; Customizations</h4>
            <ul className="addin-list">
              {addIns.map((addIn, idx) => (
                <li key={idx} className="addin-item">+ {addIn}</li>
              ))}
            </ul>
          </div>
        )}

        {notes && notes !== 'None' && (
          <div className="kitchen-card-notes">
            <strong>Notes:</strong>
            <p>{notes}</p>
          </div>
        )}
      </div>

      <div className="kitchen-card-actions">
        <button
          className="btn-kitchen-undo"
          onClick={undoFunc}
          disabled={status === 'In Queue'}
          title="Revert to previous status"
        >
          ↶ Undo
        </button>
        <button
          className={`btn-kitchen-check ${status === 'Completed' ? 'btn-kitchen-completed' : ''}`}
          onClick={checkFunc}
          title="Advance status"
        >
          {status === 'In Queue' && 'Start Prep →'}
          {status === 'Preparing' && 'Mark Ready ✓'}
          {status === 'Ready' && 'Complete Order ✓✓'}
          {status === 'Completed' && 'Completed ✓'}
        </button>
      </div>
    </div>
  );
}
