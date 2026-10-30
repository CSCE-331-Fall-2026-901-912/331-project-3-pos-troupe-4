import { useNavigate } from 'react-router-dom';

export default function RoleSelector() {
    const navigate = useNavigate();
    return (
        <div>
            <label>Welcome to our POS! Choose your mode:</label>
            <button onClick={() => navigate("/cashier")}>
                Cashier Mode
            </button>
            <button onClick={() => navigate("/manager")}>
                Manager Mode
            </button>
            <button onClick={() => navigate("/kitchen")}>
                Kitchen Mode
            </button>
            <button onClick={() => navigate("/kiosk")}>
                Kiosk Mode
            </button>
        </div>
    );
}