import {
    createContext,
    useCallback,
    useEffect,
    useState,
} from 'react';
import type { ReactNode } from 'react';
import { getAuthSession } from '../lib/authAPI';
import type { AuthSession } from '../types/AuthSession';

interface AuthContextValue {
    authSession: AuthSession;
    isAuthenticated: boolean;
    isLoading: boolean;
    refreshAuthState: () => Promise<void>;
}

const anonymousSession: AuthSession = {
    isAuthenticated: false,
    userName: null,
    email: null,
    roles: [],
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [authSession, setAuthSession] = useState<AuthSession>(anonymousSession);
    const [isLoading, setIsLoading] = useState(true);

    const refreshAuthState = useCallback(async () => {
        try {
            const session = await getAuthSession();
            setAuthSession(session);
        } catch {
            setAuthSession(anonymousSession);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void refreshAuthState();
    }, [refreshAuthState]);

    return (
        <AuthContext.Provider
            value={{
                authSession,
                isAuthenticated: authSession.isAuthenticated,
                isLoading,
                refreshAuthState,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export { AuthContext };
