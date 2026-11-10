import { useEffect, useState } from 'react';
import '../../page-styles/KioskMainPage.css';
import { getAddableItems } from '../../api';
import { ADDON_PRICE } from './KioskCartHandling';
import DrinkIcon from './DrinkIcon';

const labelOf = (x) => (typeof x === 'string' ? x : x.name);
const isPackaging = (name) => /cup|lid|napkin|straw|sleeve|seal|bag/i.test(name);
const ICE_OPTIONS = ['- No Ice', '- Less Ice', '+ Extra Ice'];
const SUGAR_OPTIONS = ['- Less Sugar', '- Half Sugar', '+ Extra Sugar'];

export default function CustomizationScreen({ item, initialCustomization, onCancel, onConfirm }) {
  const [addable, setAddable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removed, setRemoved] = useState(initialCustomization?.removed || []);
  const [addIns, setAddIns] = useState(initialCustomization?.addOns || []);
  const [ice, setIce] = useState(initialCustomization?.ice || '');
  const [sugar, setSugar] = useState(initialCustomization?.sugar || '');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getAddableItems();
        if (!cancelled) setAddable(data);
      } catch (err) {
        console.error('Error loading add-ins:', err);
        if (!cancelled) setError("Couldn't load add-ins");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  function toggleRemoved(label) {
    setRemoved((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  }

  function toggleAddIn(addIn) {
    const targetLabel = labelOf(addIn);
    setAddIns((prev) =>
      prev.some((selected) => labelOf(selected) === targetLabel)
        ? prev.filter((selected) => labelOf(selected) !== targetLabel)
        : [...prev, targetLabel]
    );
  }

  const basePrice = Number(item.price) || 0;
  const total = basePrice + addIns.length * ADDON_PRICE;

  function handleConfirm() {
    onConfirm({
      productName: item.name,
      constituentItems: (item.constituentItems ?? []).map(labelOf),
      addOns: addIns.map(labelOf),
      removed,
      ice,
      sugar,
      itemTotal: total,
    });
  }

  function ChoiceSection({ title, options, value, onChange }) {
    return (
      <section>
        <h3>{title}</h3>
        <div className='option-grid'>
          {options.map((option) => (
            <button key={option}
              className={`option-button ${value === option ? 'selected' : ''}`}
              onClick={() => onChange(value === option ? '' : option)}>
              {option}
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <main className="customize-container" style={{ paddingBottom: '9rem' }}>
      <header className="kiosk-custom-header" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border, #E5ECE6)' }}>
        <DrinkIcon name={item.name} size={64} />
        <div>
          <h2 style={{ margin: '0 0 0.25rem', color: 'var(--primary-color, #2E6F5E)' }}>
            {initialCustomization ? 'Modifying: ' : 'Customize '}{item.name}
          </h2>
          <span style={{ fontSize: '1rem', color: 'var(--font-muted, #64748b)', fontWeight: 500 }}>
            Base Price: ${basePrice.toFixed(2)}
          </span>
        </div>
      </header>

      {(item.constituentItems ?? []).filter((c) => !isPackaging(labelOf(c))).length > 0 && (
        <section>
          <h3>Included ingredients (tap to omit)</h3>
          <div className="option-grid">
            {(item.constituentItems ?? [])
              .filter((c) => !isPackaging(labelOf(c)))
              .map((c) => {
                const label = labelOf(c);
                const isRemoved = removed.includes(label);
                return (
                  <button key={label} className={`option-button ${isRemoved ? 'removed' : ''}`} onClick={() => toggleRemoved(label)}>
                    {isRemoved ? `No ${label}` : label}
                  </button>
                );
              })}
          </div>
        </section>
      )}

      <section>
        <h3>Available Add-ins &amp; Toppings (+${ADDON_PRICE.toFixed(2)} each)</h3>
        {loading && <p>Loading add-ins...</p>}
        {error && <p className="kiosk-error">{error}</p>}
        <div className="option-grid">
          {addable.map((addIn) => {
            const label = labelOf(addIn);
            const selected = addIns.some((selected) => labelOf(selected) === label);
            return (
              <button key={label} className={`option-button ${selected ? 'selected' : ''}`} onClick={() => toggleAddIn(addIn)}>
                +{label}
              </button>
            );
          })}
        </div>
      </section>

      <ChoiceSection title="Ice Level" options={ICE_OPTIONS} value={ice} onChange={setIce} />
      <ChoiceSection title="Sweetness Level" options={SUGAR_OPTIONS} value={sugar} onChange={setSugar} />

      {/* Fixed running subtotal bottom bar matching main kiosk screen */}
      <div className="order-bar">
        <button
          type="button"
          className="btn btn--outline"
          onClick={onCancel}
          style={{ minHeight: '52px', padding: '0 1.75rem', fontSize: '1rem', fontWeight: 600 }}
        >
          ← Cancel
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.85rem', color: '#737373', display: 'block' }}>Drink Total</span>
            <strong style={{ fontSize: '1.35rem', color: 'var(--primary-color, #2E6F5E)' }}>${total.toFixed(2)}</strong>
          </div>
          <button
            type="button"
            className="checkout-button"
            onClick={handleConfirm}
          >
            {initialCustomization ? 'Save Changes' : 'Add to Order'} • ${total.toFixed(2)}
          </button>
        </div>
      </div>
    </main>
  );
}
