import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';

export default function EmployeeRoute({ children, managerOnly = false }) {
    const [status, setStatus] = useState('loading');

    useEffect(() => {
        async function checkAuth() {
            try {
                const response = await fetch('/api/auth/me');

                if (!response.ok) {
                    setStatus('unauthorized');
                    return;
                }

                const employee = await response.json();

                if (managerOnly && !employee.isManager) {
                    setStatus('forbidden');
                    return;
                }

                setStatus('authorized');
            } catch (err) {
                console.error('Authentication check failed:', err);
                setStatus('unauthorized');
            }
        }

        checkAuth();
    }, [managerOnly]);

    if (status === 'loading') {
        return <p>Checking login...</p>;
    }

    if (status === 'unauthorized' || status === 'forbidden') {
        return <Navigate to="/" replace />;
    }

    return children;
}