import { Link } from 'react-router-dom';
import { useCookieConsent } from '../context/CookieConsentContext';

export default function CookieConsentBanner() {
    const { hasAcknowledgedConsent, acknowledgeConsent } = useCookieConsent();

    if (hasAcknowledgedConsent) {
        return null;
    }

    return (
        <aside className="cookie-consent-banner shadow-lg" role="dialog" aria-live="polite">
            <div className="cookie-consent-copy">
                <p className="cookie-consent-eyebrow mb-2">Cookie Notice</p>
                <p className="mb-2">
                    This application uses essential cookies for sign-in and security functionality.
                    External providers such as Google can set temporary cookies during login.
                </p>
                <p className="mb-0">
                    We are not enabling analytics or advertising cookies in this version. Read the{' '}
                    <Link to="/cookies">cookie policy</Link> for details.
                </p>
            </div>
            <button type="button" className="btn btn-warning fw-semibold" onClick={acknowledgeConsent}>
                Acknowledge Essential Cookies
            </button>
        </aside>
    );
}
