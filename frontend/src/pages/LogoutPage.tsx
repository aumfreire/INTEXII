import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AlertBanner from '../components/ui/AlertBanner';
import { useAuth } from '../context/useAuth';
import { logoutUser } from '../lib/authAPI';

export default function LogoutPage() {
    const navigate = useNavigate();
    const [message, setMessage] = useState('Signing you out...');
    const [errorMessage, setErrorMessage] = useState('');
    const { refreshAuthState } = useAuth();

    useEffect(() => {
        let isMounted = true;

        async function runLogout() {
            try {
                await logoutUser();
                await refreshAuthState();
                if (isMounted) {
                    setMessage('You are now signed out.');
                    navigate('/login', { replace: true });
                }
            } catch (error) {
                if (isMounted) {
                    setErrorMessage(
                        error instanceof Error ? error.message : 'Unable to log out.'
                    );
                    setMessage('Logout did not complete.');
                }
            }
        }

        void runLogout();

        return () => {
            isMounted = false;
        };
    }, [navigate, refreshAuthState]);

    return (
        <div className="container" style={{ padding: '48px 24px' }}>
            <div className="login-card" style={{ maxWidth: '560px' }}>
                <h2>Logout</h2>
                <p>{message}</p>
                {errorMessage ? (
                    <AlertBanner
                        message={errorMessage}
                        type="warning"
                        onClose={() => setErrorMessage('')}
                    />
                ) : null}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Link to="/" className="btn btn-outline-secondary">
                        Return Home
                    </Link>
                    <Link to="/login" className="btn btn-primary">
                        Go to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
