import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setStoredAuthToken } from '../lib/authAPI';
import { useAuth } from '../context/useAuth';

export default function AuthCallbackPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { refreshAuthState } = useAuth();

    useEffect(() => {
        const externalError = searchParams.get('externalError');
        if (externalError) {
            navigate(`/login?externalError=${encodeURIComponent(externalError)}`, { replace: true });
            return;
        }

        const returnPath = searchParams.get('returnPath') || '/dashboard';
        const authToken = searchParams.get('authToken');

        if (authToken) {
            setStoredAuthToken(authToken);
        }

        void refreshAuthState().finally(() => {
            navigate(returnPath, { replace: true });
        });
    }, [navigate, refreshAuthState, searchParams]);

    return <div style={{ padding: '48px 24px' }}>Completing sign-in...</div>;
}
