import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import './RoleSelector.css';

export default function RoleSelector() {
    const navigate = useNavigate();
    const [logoutStatus, setLogoutStatus] = useState('loggingOut');

    const handleDemoLogin = async (mode) => {
        try {
            const response = await fetch('/api/auth/demo', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ mode })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Demo login failed');
            }

            navigate(data.redirectTo);

        } catch (error) {
            console.error('Demo login error:', error);
            alert(error.message);
        }
    };

    useEffect(() => {
        const logout = async () => {
            try {
                const response = await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('Logout failed');
                }

                setLogoutStatus('ready');
            } catch (error) {
                console.error('Logout error:', error);
                setLogoutStatus('error');
            }
        };

        logout();
    }, []);

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
        },
        {
            title: 'Customer Online Ordering',
            badge: 'Beyond Feature (PB-15)',
            description: 'Order ahead from mobile or desktop with customer accounts, drink customization, and live pickup status.',
            path: '/order',
            icon: '🛍️',
            isCustomer: true
        }
    ];

    return (
        <main id="main"  className="role-container">
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
                            <div key={mode.path} className="role-card-wrapper">
                                <div
                                    className={`role-card ${mode.isCustomer ? 'role-card--highlight' : ''}`}
                                    onClick={() => {
                                        if (logoutStatus !== 'ready') return;
                                        if (mode.path === '/manager') {
                                            window.location.href = '/api/auth/github?mode=manager';
                                        } else if (mode.path === '/cashier') {
                                            window.location.href = '/api/auth/github?mode=cashier';
                                        } else if (mode.path === '/kitchen') {
                                            window.location.href = '/api/auth/github?mode=kitchen';
                                        } else {
                                            navigate(mode.path);
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            if (mode.path === '/manager') window.location.href = '/api/auth/github?mode=manager';
                                            else if (mode.path === '/cashier') window.location.href = '/api/auth/github?mode=cashier';
                                            else if (mode.path === '/kitchen') window.location.href = '/api/auth/github?mode=kitchen';
                                            else navigate(mode.path);
                                        }
                                    }}
                                >
                                    <div className="role-card-top">
                                        <span className="role-icon">{mode.icon}</span>
                                        {mode.badge && <span className="role-badge">{mode.badge}</span>}
                                    </div>
                                    <h3>{mode.title}</h3>
                                    <p>{mode.description}</p>

                                    {mode.isCustomer ? (
                                        <div className="role-customer-actions">
                                            <button
                                                type="button"
                                                className="role-sub-btn role-sub-btn--desktop"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate('/order?view=desktop');
                                                }}
                                                title="Open full desktop customer website"
                                            >
                                                🖥️ Desktop View
                                            </button>
                                            <button
                                                type="button"
                                                className="role-sub-btn role-sub-btn--mobile"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate('/order?view=mobile');
                                                }}
                                                title="Open mobile smartphone simulator"
                                            >
                                                📱 Phone Simulator
                                            </button>
                                        </div>
                                    ) : (
                                        <span className="role-card-link">
                                            Open Mode →
                                        </span>
                                    )}
                                </div>

                                {mode.path !== '/kiosk' && !mode.isCustomer && (
                                    <button
                                        className="demo-login-button"
                                        disabled={logoutStatus !== 'ready'}
                                        onClick={() => handleDemoLogin(mode.path.substring(1))}
                                    >
                                        Demo Login →
                                    </button>
                                )}
                            </div>
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