import { useEffect, useState } from 'react';
import './KioskMainPage.css';
import { getMenuItems } from '../../api';

export default function KioskPage() {
    const [menuItems, setMenuItems] = useState([]);
    const [error, setError] = useState('');
    const [loading,setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        async function loadMenu() {
            try {
                const data = await getMenuItems();
                if (!cancelled) setMenuItems(data);
            } catch (err) {
                console.error('Error loading menu:', err);
                if (!cancelled) setError("Couldn't load the menu");
            } finally {
                if (!cancelled) setLoading(false);
            }
        }
        loadMenu();
        return () => {cancelled = true;};
    }, []);
    
    if (loading) return <p>Loading menu</p>
    if (error) return <p className='kiosk-error'>Couldn't load the menu.</p>
    
    return (
        <main className="kiosk-container">
            <div className="menu-grid">
                {menuItems.map((item) => (
                    <button key={item.id ?? item.name} className="kiosk-button">
                        <span className="name">{item.name}</span>
                        <span className="price"> ${Number(item.price).toFixed(2)}</span>
                    </button>
                ))}
            </div>
        </main>
    );
}