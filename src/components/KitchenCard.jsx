export default function KitchenCard({ receiptNum, orderContents, notes, undoFunc, checkFunc }) {
  return (
    <div class="component">
      {'Order ID: ' + receiptNum}
      {'Order Products: ' + orderContents}
      {'Notes: ' + notes}

      <button onClick={undoFunc}> Undo </button>
      <button onClick={checkFunc}> CheckBox </button>
    </div>
  );
}
