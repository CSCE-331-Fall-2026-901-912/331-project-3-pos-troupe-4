export default function KitchenCard({ receiptNum, orderContents, notes, undoFunc, checkFunc }) {
  const productItems = orderContents.map(product => <li>{product}</li>);
  return (
    <div className="component">
      <ul className="component-list">
        <li className="component-list-item"> {'ID: ' + receiptNum} </li>
        <li className="component-list-item">{'Notes: ' + notes}</li>
        <li className="component-list-item">
          <button onClick={undoFunc}> Undo </button>
          <button onClick={checkFunc}> CheckBox </button>
        </li>
      </ul>
      <ul className="component-list">
        <li className="component-list-item order-products"> Order Products:
          <ul className="product-list">{productItems}</ul>
        </li>
      </ul>
    </div>
  );
}
