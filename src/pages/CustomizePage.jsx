import { useEffect, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { getAddableItems } from '../api';
import { useCart, ADDON_PRICE } from '../components/Cashier/CartHandling';

const ICE_OPTIONS = ['- No Ice', '- Less Ice', '+ Extra Ice'];
const SUGAR_OPTIONS = ['- Less Sugar', '- Half Sugar', '+ Extra Sugar'];

export default function CustomizePage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [addable, setAddable] = useState([]);
  const [removed, setRemoved] = useState([]);
  const [addOns, setAddOns] = useState([]);
  const [ice, setIce] = useState('');
  const [sugar, setSugar] = useState('');

  useEffect(() => {
    async function loadAddable() {
      try {
        const data = await getAddableItems();
        setAddable(data);
      } catch (error) {
        console.error('Error loading add-ins:', error);
      }
    }
    loadAddable();
  }, []);

  if (!state) {
    return <Navigate to="/cashier" />;
  }
  const product = state.product;
  function toggle(list, setList, name) {
    if (list.includes(name)) {
      setList(list.filter((n) => n !== name));
    } else {
      setList([...list, name]);
    }
  }

  const itemTotal = (Number(product?.price) || 0) + (addOns?.length || 0) * ADDON_PRICE;

  function handleAdd() {
    addItem({
      productName: product.name,
      constituentItems: product.constituentItems || [],
      removed: removed,
      addOns: addOns,
      ice: ice,
      sugar: sugar,
      itemTotal: itemTotal,
    });
    navigate('/cashier');
  }

  const isPackaging = (name) => /cup|lid|napkin|straw|sleeve/i.test(name);
  const removableConstituents = (product.constituentItems || []).filter(
    (name) => !isPackaging(name)
  );

  return (
    <div className="custom">
      <header className="custom__header">
        <button className="btn btn--outline" onClick={() => navigate('/cashier')}>Cancel</button>
        <h2>Customizing: {product.name}</h2>
        <span className="custom__total">Item Total: ${itemTotal.toFixed(2)}</span>
        <button className="btn btn--primary" onClick={handleAdd}>Add to Order</button>
      </header>

      <h4>Base Recipe Ingredients (click to omit/remove):</h4>
      <div className="custom__row">
        {removableConstituents.length === 0 && (
          <span className="muted">Standard base recipe (no modifiable base ingredients).</span>
        )}
        {removableConstituents.map((name) => (
          <button
            key={name}
            className={removed.includes(name) ? 'chip chip--off' : 'chip chip--on'}
            onClick={() => toggle(removed, setRemoved, name)}
          >
            {removed.includes(name) ? '[ ]' : '[+]'} {name}
          </button>
        ))}
      </div>

      <h4>Available Add-ins &amp; Toppings (+${ADDON_PRICE.toFixed(2)} each):</h4>
      <div className="custom__grid">
        {addable.map((name) => (
          <button
            key={name}
            className={addOns.includes(name) ? 'chip chip--big chip--selected' : 'chip chip--big'}
            onClick={() => toggle(addOns, setAddOns, name)}
          >
            +{name}<br />(+${ADDON_PRICE.toFixed(2)})
          </button>
        ))}
      </div>

      <h4>Ice &amp; Sweetness Preferences:</h4>
      <div className="custom__row">
        {ICE_OPTIONS.map((option) => (
          <button
            key={option}
            className={ice === option ? 'chip chip--big chip--selected' : 'chip chip--big'}
            onClick={() => setIce(ice === option ? '' : option)}
          >
            {option}
          </button>
        ))}
        {SUGAR_OPTIONS.map((option) => (
          <button
            key={option}
            className={sugar === option ? 'chip chip--big chip--selected' : 'chip chip--big'}
            onClick={() => setSugar(sugar === option ? '' : option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
