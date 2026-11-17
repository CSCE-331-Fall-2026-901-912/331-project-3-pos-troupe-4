import React, { useState, useEffect } from 'react';
import { getAddableItems } from '../../api';
import DrinkIcon from '../Kiosk/DrinkIcon';
import { CUSTOMER_ADDON_PRICE } from './CustomerCartContext';

const SWEETNESS_OPTIONS = ['100% (Normal)', '70% (Less Sweet)', '50% (Half Sweet)', '30% (Slight)', '0% (Unsweetened)'];
const ICE_OPTIONS = ['Regular Ice', 'Less Ice', 'No Ice', 'Extra Ice'];
const SIZE_OPTIONS = [
  { label: 'Regular (16 oz)', extra: 0.00 },
  { label: 'Large (24 oz)', extra: 0.75 },
];

export default function CustomerCustomizationModal({
  item,
  initialData,
  onClose,
  onConfirm,
  isMobile,
  isSimulated
}) {
  const [addableItems, setAddableItems] = useState([]);
  const [loadingAddables, setLoadingAddables] = useState(true);

  const [size, setSize] = useState(initialData?.size || 'Regular (16 oz)');
  const [sweetness, setSweetness] = useState(initialData?.sugar || '100% (Normal)');
  const [ice, setIce] = useState(initialData?.ice || 'Regular Ice');
  const [selectedAddons, setSelectedAddons] = useState(initialData?.addOns || []);
  const [specialInstructions, setSpecialInstructions] = useState(initialData?.notes || '');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await getAddableItems();
        if (active) setAddableItems(data || []);
      } catch (e) {
        console.error('Failed to load addable items', e);
      } finally {
        if (active) setLoadingAddables(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  function toggleAddon(name) {
    setSelectedAddons((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  }

  const basePrice = Number(item.price) || 0;
  const sizeExtra = size.includes('Large') ? 0.75 : 0.00;
  const addonsTotal = selectedAddons.length * CUSTOMER_ADDON_PRICE;
  const unitTotal = basePrice + sizeExtra + addonsTotal;

  function handleSave() {
    onConfirm({
      productName: item.name,
      basePrice,
      size,
      sugar: sweetness,
      ice,
      addOns: selectedAddons,
      notes: specialInstructions.trim(),
      constituentItems: item.constituentItems || [],
      itemTotal: unitTotal
    });
  }

  return (
    <div className={`customer-modal-backdrop ${isMobile ? 'is-mobile-backdrop' : ''} ${isSimulated ? 'is-simulated-backdrop' : ''}`} onClick={onClose}>
      <div
        className={`customer-modal-card ${isMobile ? 'is-mobile-sheet' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="custom-modal-title"
      >
        {/* Header */}
        <div className="custom-modal-header">
          <div className="custom-modal-drink-info">
            <DrinkIcon name={item.name} size={52} />
            <div>
              <h2 id="custom-modal-title">{item.name}</h2>
              <span className="custom-modal-base-price">Base: ${basePrice.toFixed(2)}</span>
            </div>
          </div>
          <button className="custom-modal-close" onClick={onClose} aria-label="Close customization">✕</button>
        </div>

        {/* Scrollable Body */}
        <div className="custom-modal-body">
          {/* Size Selection */}
          <section className="custom-section">
            <label className="custom-section-title">Drink Size</label>
            <div className="custom-options-row">
              {SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  className={`custom-pill-btn ${size === opt.label ? 'active' : ''}`}
                  onClick={() => setSize(opt.label)}
                >
                  <span>{opt.label}</span>
                  {opt.extra > 0 && <span className="pill-extra">+${opt.extra.toFixed(2)}</span>}
                </button>
              ))}
            </div>
          </section>

          {/* Sweetness */}
          <section className="custom-section">
            <label className="custom-section-title">Sweetness Level</label>
            <div className="custom-options-grid">
              {SWEETNESS_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`custom-pill-btn ${sweetness === opt ? 'active' : ''}`}
                  onClick={() => setSweetness(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>

          {/* Ice */}
          <section className="custom-section">
            <label className="custom-section-title">Ice Level</label>
            <div className="custom-options-grid">
              {ICE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  className={`custom-pill-btn ${ice === opt ? 'active' : ''}`}
                  onClick={() => setIce(opt)}
                >
                  {opt}
                </button>
              ))}
            </div>
          </section>

          {/* Add-ins & Toppings */}
          <section className="custom-section">
            <div className="custom-section-header-flex">
              <label className="custom-section-title">Toppings &amp; Add-ins</label>
              <span className="custom-section-sub">+$0.50 each</span>
            </div>

            {loadingAddables ? (
              <p className="custom-loading-text">Loading fresh toppings...</p>
            ) : (
              <div className="custom-options-grid">
                {addableItems.map((addon) => {
                  const name = typeof addon === 'string' ? addon : addon.name || addon.item_name;
                  const isSelected = selectedAddons.includes(name);
                  return (
                    <button
                      key={name}
                      type="button"
                      className={`custom-pill-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => toggleAddon(name)}
                    >
                      <span>{isSelected ? `✓ ${name}` : `+ ${name}`}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Special Instructions */}
          <section className="custom-section">
            <label className="custom-section-title" htmlFor="special-notes-input">Special Instructions (Optional)</label>
            <input
              id="special-notes-input"
              type="text"
              className="custom-notes-input"
              placeholder="E.g., extra cup sleeve, warm water rinse..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              maxLength={120}
            />
          </section>
        </div>

        {/* Footer */}
        <div className="custom-modal-footer">
          <div className="custom-footer-price">
            <span className="footer-price-label">Item Total</span>
            <span className="footer-price-val">${unitTotal.toFixed(2)}</span>
          </div>
          <div className="custom-footer-actions">
            <button type="button" className="custom-cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="custom-confirm-btn" onClick={handleSave}>
              {initialData ? 'Update Item' : 'Add to Bag'} · ${unitTotal.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
