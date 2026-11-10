import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { placeOrder } from "../../api";
import { useKioskCart } from "./KioskCartHandling";
import "../../page-styles/KioskMainPage.css";

const KIOSK_EMPLOYEE_ID = 0;

export default function CheckoutPage({ onBack, onDone}) {
    const {items, removeItem, clearCart, customerName, setCustomerName, subtotal, tax, total} = useKioskCart();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit() {
        if (submitting || items.length ===0) return;

        const order ={
            employeeId: KIOSK_EMPLOYEE_ID,
            customerName: customerName.trim() || 'Guest',
            totalPrice: total,
            items: (items || []).map((item) => ({
                productName: item.productName,
                selectAddOns: (item.addOns || []).map((name) => ({ itemName: name, isAddition: true })),
                finalConstituentItems: [
                    ...(item.constituentItems || []).filter((name) => !(item.removed || []).includes(name)),
                    ...(item.addOns || []),
                ],
            })),
        };

        setSubmitting(true);
        setError('');
        try{
            const res = await placeOrder(order);
            clearCart();
            setCustomerName('');
            onDone(res?.orderId);
        }catch(err){
            console.error('Error submitting order:', err);
            setError('Could not submit the order. Please try again or ask for assistance.');
            setSubmitting(false);
        }
    }
    return(
        <main className="checkout-container">
            <h2>Your order</h2>
                <label className="checkout-name">
                    <span> Name for your order: </span>
                    <input
                        type="text"
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        placeholder="Your name"
                        maxLength={40}
                        autoComplete="off"
                    />
                </label>

            {items.length === 0 ? (
                <p className="checkout-empty"> Your order is empty.</p>
            ) : (
                <ul className="checkout-list">
                    {items.map((item, index) => (
                        <li key={index} className="checkout-item">
                            <div className="checkout-item-detail">
                                <span className="checkout-item-name">{item.productName} </span>
                                {item.removed.map((name) => (
                                    <span key={name} className="checkout-mod removed">No {name} </span>
                                ))}
                                {item.addOns.map((name) => (
                                    <span key={name} className="checkout-mod added">+ {name} </span>
                                ))}
                                {item.ice && <span className="checkout-mod">{item.ice} </span>}
                                {item.sugar && <span className="checkout-mod">{item.sugar} </span>}
                            </div>
                            <span className="checkout-item-price">${item.itemTotal.toFixed(2)}</span>
                            <button className="checkout-remove" onClick={() => removeItem(index)} aria-label={`Remove ${item.productName} from order`}>
                                Remove
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {error && <p className="kiosk-error">{error}</p>}

            <footer className="checkout-footer">
                <button className="checkout-button" onClick={onBack}>Back to menu</button>
                <div className="checkout-totals">
                    <span>Subtotal: ${subtotal.toFixed(2)} </span>
                    <span>Tax: ${tax.toFixed(2)} </span>
                    <strong className="checkout-total">Total: ${total.toFixed(2)}</strong>
                </div>
                <button className="checkout-button confirm" onClick={handleSubmit} disabled={items.length === 0 || submitting}>
                    {submitting ? 'Placing order...' : 'Place order'}
                </button>
            </footer>
        </main>
    );
}