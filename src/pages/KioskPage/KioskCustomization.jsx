import { useEffect, useState } from 'react';
import './KioskCustomization.css';
import {getAddableItems } from '../../api';
import { ADDON_PRICE } from '../../components/Cashier/CartHandling';

const labelOf = (x) => (typeof x === 'string' ? x : x.name);

export default function CustomizationScreen({item, onCancel, onConfirm}) {
    const [addable, setAddable] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [removed, setRemoved] = useState([]);
    const [addIns, setAddIns] = useState([]);

    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const data = await getAddableItems();
                if (!cancelled) setAddable(data);
            } catch (err) {
                console.error('Error loading add-ins:', err);
                if (!cancelled) setError("Couldn't load add-ins");
            } finally{
                if (!cancelled) setLoading(false);
            }
        }

        load();
        return () => {cancelled = true; };
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
                : [...prev,addIn]
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
            itemTotal: total,
        });
    }

    return (
        <main className="customize-container">
            <h2>{item.name}</h2>

            <section>
                <h3>Included items (tap to remove)</h3>
                <div className="option-grid">
                    {(item.constituentItems ?? []).map((c) => {
                        const label = labelOf(c);
                        const isRemoved = removed.includes(label);
                        return (
                            <button key={label} className={`option-button ${isRemoved ? 'removed' : ''}`} onClick={() => toggleRemoved(label)}>
                                {isRemoved ? `No ${label}` : label}
                            </button>
                        )
                    })}
                </div>
            </section>

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
            <footer className="customize-footer">
                <button className="option-button" onClick={onCancel}>Back</button>
                <button className="option-button confirm" onClick={handleConfirm}>
                    Add to order · ${total.toFixed(2)}
                </button>
            </footer>
        </main>
    )
}