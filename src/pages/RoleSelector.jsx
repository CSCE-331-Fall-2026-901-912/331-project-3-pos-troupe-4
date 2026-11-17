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
            icon: '💳',
            requiresAuth: true
        },
        {
            title: 'Manager Mode',
            description: 'Manage inventory, employees, menu items, prices, and sales reports.',
            path: '/manager',
            icon: '📊',
            requiresAuth: true
        },
        {
            title: 'Kitchen Mode',
            description: 'View incoming orders, check customized add-ins, and advance preparation status.',
            path: '/kitchen',
            icon: '🍳',
            requiresAuth: true
        },
        {
            title: 'Kiosk Mode',
            description: 'Allow customers to browse the menu, customize toppings, and place self-service orders.',
            path: '/kiosk',
            icon: '🍵',
            requiresAuth: false
        },
        {
            title: 'Customer Online Ordering',
            description: 'Order ahead from mobile or desktop with customer accounts, drink customization, and live pickup status.',
            path: '/order',
            icon: '🛍️',
            isCustomer: true
        }
    ];

    function handleDefaultAction(mode) {
        if (logoutStatus !== 'ready') return;
        if (mode.path === '/manager') {
            window.location.href = '/api/auth/github?mode=manager';
        } else if (mode.path === '/cashier') {
            window.location.href = '/api/auth/github?mode=cashier';
        } else if (mode.path === '/kitchen') {
            window.location.href = '/api/auth/github?mode=kitchen';
        } else if (mode.isCustomer) {
            navigate('/order?view=desktop');
        } else {
            navigate(mode.path);
        }
    }

    return (
        <main id="main" className="role-container">
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
                            <div
                                key={mode.path}
                                className={`role-card ${mode.isCustomer ? 'role-card--highlight' : ''}`}
                                onClick={() => handleDefaultAction(mode)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        handleDefaultAction(mode);
                                    }
                                }}
                            >
                                <div className="role-card-top">
                                    <span className="role-icon">{mode.icon}</span>
                                </div>
                                <h3>{mode.title}</h3>
                                <p>{mode.description}</p>

                                <div className="role-card-actions">
                                    {mode.requiresAuth && (
                                        <>
                                            <button
                                                type="button"
                                                className="role-sub-btn role-sub-btn--primary"
                                                disabled={logoutStatus !== 'ready'}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.location.href = `/api/auth/github?mode=${mode.path.substring(1)}`;
                                                }}
                                                title="Log in with verified GitHub account"
                                            >
                                                Log In
                                            </button>
                                            <button
                                                type="button"
                                                className="role-sub-btn role-sub-btn--demo"
                                                disabled={logoutStatus !== 'ready'}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDemoLogin(mode.path.substring(1));
                                                }}
                                                title="Test with demo account"
                                            >
                                                Demo Login
                                            </button>
                                        </>
                                    )}

                                    {mode.path === '/kiosk' && (
                                        <button
                                            type="button"
                                            className="role-sub-btn role-sub-btn--primary role-sub-btn--full"
                                            disabled={logoutStatus !== 'ready'}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate('/kiosk');
                                            }}
                                        >
                                            Launch Kiosk →
                                        </button>
                                    )}

                                    {mode.isCustomer && (
                                        <>
                                            <button
                                                type="button"
                                                className="role-sub-btn role-sub-btn--primary"
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
                                        </>
                                    )}
                                </div>
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