import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

const cookieConsentStorageKey = 'intex-cookie-consent';

interface CookieConsentContextValue {
    hasAcknowledgedConsent: boolean;
    acknowledgeConsent: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextValue | undefined>(undefined);

function readInitialConsentValue() {
    if (typeof window === 'undefined') {
        return false;
    }

    return window.localStorage.getItem(cookieConsentStorageKey) === 'acknowledged';
}

export function CookieConsentProvider({ children }: { children: ReactNode }) {
    const [hasAcknowledgedConsent, setHasAcknowledgedConsent] = useState(readInitialConsentValue);

    const value = useMemo<CookieConsentContextValue>(
        () => ({
            hasAcknowledgedConsent,
            acknowledgeConsent() {
                window.localStorage.setItem(cookieConsentStorageKey, 'acknowledged');
                setHasAcknowledgedConsent(true);
            },
        }),
        [hasAcknowledgedConsent]
    );

    return <CookieConsentContext.Provider value={value}>{children}</CookieConsentContext.Provider>;
}

export function useCookieConsent() {
    const context = useContext(CookieConsentContext);

    if (!context) {
        throw new Error('useCookieConsent must be used within a CookieConsentProvider.');
    }

    return context;
}
