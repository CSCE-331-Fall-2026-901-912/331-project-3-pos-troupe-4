import { useEffect, useState } from 'react';
import '../../page-styles/KioskMainPage.css';
import { getAddableItems } from '../../api';
import { ADDON_PRICE } from './KioskCartHandling';

const labelOf = (x) => (typeof x === 'string' ? x : x.name);
const isPackaging = (name) => /cup|lid|napkin|straw|sleeve|seal|bag/i.test(name);
const ICE_OPTIONS = ['- No Ice', '- Less Ice', '+ Extra Ice'];
const SUGAR_OPTIONS = ['- Less Sugar', '- Half Sugar', '+ Extra Sugar'];

export default function CustomizationScreen({ item, onCancel, onConfirm }) {
  const [addable, setAddable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removed, setRemoved] = useState([]);
  const [addIns, setAddIns] = useState([]);
  const [ice, setIce] = useState('');
  const [sugar, setSugar] = useState('');

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
    setAddIns((prev) =>
      prev.some((selected) => labelOf(selected) === labelOf(addIn))
        ? prev.filter((selected) => labelOf(selected) !== labelOf(addIn))
        : [...prev, addIn]
    )
  };

  const total =
    Number(item.price) + addIns.reduce((sum, addIn) => sum + Number(addIn.price ?? ADDON_PRICE), 0);

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
    )
  };

  return (
    <main className="customize-container">
      <h2>{item.name}</h2>

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
        <h3>Add-ins</h3>
        {loading && <p>Loading add-ins</p>}
        {error && <p className="kiosk-error">{error}</p>}
        <div className="option-grid">
          {addable.map((addIn) => {
            const label = labelOf(addIn);
            const selected = addIns.some((selected) => labelOf(selected) === label);
            return (
              <button key={label} className={`option-button ${selected ? 'selected' : ''}`} onClick={() => toggleAddIn(addIn)}>
                {label}
                {addIn.price != null && ` +$${Number(addIn.price).toFixed(2)}`}
              </button>
            );
          })}
        </div>
      </section>

      <ChoiceSection title="Ice" options={ICE_OPTIONS} value={ice} onChange={setIce} />
      <ChoiceSection title="Sweetness" options={SUGAR_OPTIONS} value={sugar} onChange={setSugar} />
      <footer className="customize-footer">
        <button className="option-button" onClick={onCancel}>Back</button>
        <button className="option-button confirm" onClick={handleConfirm}>
          Add to order · ${total.toFixed(2)}
        </button>
      </footer>
    </main>
  )
}
