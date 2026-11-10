import { useNavigate } from 'react-router-dom';
import './RoleSelector.css';

export default function RoleSelector() {
    const navigate = useNavigate();

    const modes = [
        {
            title: 'Cashier Mode',
            description: 'Take customer orders, customize drinks, and process transactions.',
            path: '/cashier',
            icon: '💳'
        },
        {
            title: 'Manager Mode',
            description: 'Manage inventory, employees, menu items, prices, and sales reports.',
            path: '/manager',
            icon: '📊'
        },
        {
            title: 'Kitchen Mode',
            description: 'View incoming orders, check customized add-ins, and advance preparation status.',
            path: '/kitchen',
            icon: '🍳'
        },
        {
            title: 'Kiosk Mode',
            description: 'Allow customers to browse the menu, customize toppings, and place self-service orders.',
            path: '/kiosk',
            icon: '🍵'
        }
    ];

    return (
        <main className="role-container">
            <div className="role-shell">

                <header className="role-header">
                    <div>
                        <h1>Welcome to Our POS!</h1>
                        <p>CSCE 331 · Troupe 04 POS System</p>
                    </div>
                    <span className="role-status">System Ready</span>
                </header>

                <section className="role-content">
                    <div className="role-intro">
                        <h2>Choose Your Mode</h2>
                        <p>
                            Select the workspace you'd like to access.
                        </p>
                    </div>

                    <div className="role-grid">
                        {modes.map((mode) => (
                            <button
                                key={mode.path}
                                className="role-card"
                                onClick={() => {
                                    if (mode.path === '/manager') {
                                        window.location.href = '/api/auth/github?mode=manager';
                                    } else if (mode.path === '/cashier') {
                                        window.location.href = '/api/auth/github?mode=cashier';
                                    } else {
                                        navigate(mode.path);
                                    }
                                }}
                            >
                                <span className="role-icon">{mode.icon}</span>
                                <h3>{mode.title}</h3>
                                <p>{mode.description}</p>
                                <span className="role-card-link">
                                    Open Mode →
                                </span>
                            </button>
                        ))}
                    </div>
                </section>

                <footer className="role-footer">
                    CSCE 331 · Fall 2026 · Troupe 04 · Hosted on Render
                </footer>

            </div>
        </main>
    );
}