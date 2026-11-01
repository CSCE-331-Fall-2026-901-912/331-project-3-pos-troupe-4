import { useEffect, useState } from 'react';
import './KioskMainPage.css';
import { getMenuItems } from '../../api';

export default function KioskPage() {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const data = getMenuItems();
                setMenuItems(data);
            } catch(err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMenu();
    }, []);

    if (loading) return <p>Loading buttons</p>
    if (error) return <p>Error: {error}</p>
    
    return (
        <main className="kiosk-container">
            <label>Kiosk Page</label>
            <div style={{ display: 'flex', gap: '10px',flexWrap: 'wrap'}}>
                {menuItems.map((menuItem) => (
                    <button key={menuItem.id} onClick={() => alert('Clicked ${menuItem.name}')}>
                    {menuItem.name}
                    </button>
                ))}
            </div>
        </main>
    )
}