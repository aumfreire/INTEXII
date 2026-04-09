import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { ChevronLeft, KeyRound, ShieldCheck, Smartphone } from 'lucide-react';
import AlertBanner from '../components/ui/AlertBanner';
import PrimaryButton from '../components/ui/PrimaryButton';
import {
    disableTwoFactor,
    enableTwoFactor,
    getTwoFactorStatus,
    resetRecoveryCodes,
} from '../lib/authAPI';
import type { TwoFactorStatus } from '../types/TwoFactorStatus';
import { useAuth } from '../context/useAuth';
import '../styles/pages/admin-dashboard.css';
import '../styles/pages/admin-users.css';

export default function ManageMfaPage() {
    const { authSession } = useAuth();
    const isExternalOnlyAccount = authSession.isExternalOnly;
    const providerList = authSession.externalLoginProviders.join(', ');
    const [status, setStatus] = useState<TwoFactorStatus | null>(null);
    const [authenticatorCode, setAuthenticatorCode] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        void loadStatus();
    }, []);

    async function loadStatus() {
        setErrorMessage('');
        try {
            const response = await getTwoFactorStatus();
            setStatus(response);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : 'Unable to load MFA status.'
            );
        }
    }

    async function handleEnable(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');
        setIsSubmitting(true);

        try {
            const response = await enableTwoFactor(authenticatorCode);
            setStatus(response);
            setAuthenticatorCode('');
            setSuccessMessage('MFA enabled. Save your recovery codes now.');
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : 'Unable to enable MFA.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDisable() {
        setErrorMessage('');
        setSuccessMessage('');
        setIsSubmitting(true);

        try {
            const response = await disableTwoFactor();
            setStatus(response);
            setSuccessMessage('MFA has been disabled.');
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : 'Unable to disable MFA.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleResetRecoveryCodes() {
        setErrorMessage('');
        setSuccessMessage('');
        setIsSubmitting(true);

        try {
            const response = await resetRecoveryCodes();
            setStatus(response);
            setSuccessMessage('Recovery codes reset. Save the new list below.');
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Unable to reset recovery codes.'
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    function buildFallbackAuthenticatorUri(): string | null {
        if (!status?.sharedKey) {
            return null;
        }

        const account = authSession.email ?? authSession.userName ?? 'user';
        const issuer = 'INTEXII';
        const normalizedSecret = status.sharedKey.replace(/\s+/g, '');

        return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${normalizedSecret}&issuer=${encodeURIComponent(issuer)}&digits=6`;
    }

    const qrValue = status?.authenticatorUri ?? buildFallbackAuthenticatorUri();
    const recoveryCodesLeft = status?.recoveryCodesLeft ?? 0;

    return (
        <div className="container" style={{ maxWidth: '1240px', padding: '40px 24px' }}>
            <div className="admin-page-header" style={{ marginBottom: '20px' }}>
                <h1 className="admin-page-title">Manage MFA</h1>
                <p className="admin-page-subtitle">
                    Configure multi-factor authentication for {authSession.email ?? 'your account'}.
                </p>
                <div style={{ marginTop: '10px' }}>
                    <Link to="/dashboard" className="dash-panel-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <ChevronLeft size={14} />
                        Back to Dashboard
                    </Link>
                </div>
            </div>

            {status ? (
                <div className="au-summary" style={{ marginBottom: '20px' }}>
                    <div className="au-chip">
                        <div className="au-chip-icon mfa"><ShieldCheck size={20} /></div>
                        <div>
                            <div className="au-chip-value">{status.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}</div>
                            <div className="au-chip-label">MFA Status</div>
                        </div>
                    </div>
                    <div className="au-chip">
                        <div className="au-chip-icon default"><KeyRound size={20} /></div>
                        <div>
                            <div className="au-chip-value">{recoveryCodesLeft}</div>
                            <div className="au-chip-label">Recovery Codes Left</div>
                        </div>
                    </div>
                    <div className="au-chip">
                        <div className="au-chip-icon admin"><Smartphone size={20} /></div>
                        <div>
                            <div className="au-chip-value">Authenticator</div>
                            <div className="au-chip-label">Security Method</div>
                        </div>
                    </div>
                </div>
            ) : null}

            {isExternalOnlyAccount ? (
                <AlertBanner
                    type="warning"
                    message={`This account uses external sign-in (${providerList || 'provider-managed'}). MFA is managed by that provider.`}
                />
            ) : null}

            {errorMessage ? (
                <AlertBanner
                    message={errorMessage}
                    type="warning"
                    onClose={() => setErrorMessage('')}
                />
            ) : null}

            {successMessage ? (
                <AlertBanner
                    message={successMessage}
                    type="success"
                    onClose={() => setSuccessMessage('')}
                />
            ) : null}

            {status ? (
                <>
                    <div className="au-table-wrap" style={{ padding: '22px', marginBottom: '18px' }}>
                        <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--color-dark)' }}>
                            Setup Authenticator App
                        </h3>
                        <p className="au-muted" style={{ margin: '8px 0 16px', maxWidth: '760px' }}>
                            Scan the QR code with your authenticator app, or use the manual key if scanning is unavailable.
                        </p>

                        {!isExternalOnlyAccount && status.sharedKey ? (
                            <div className="au-section" style={{ marginBottom: 0 }}>
                                <div className="au-chip-label" style={{ marginBottom: '8px' }}>
                                    Step 1: Scan QR code
                                </div>
                                {qrValue ? (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            marginBottom: '14px',
                                        }}
                                    >
                                        <QRCodeSVG
                                            value={qrValue}
                                            size={180}
                                            includeMargin
                                        />
                                    </div>
                                ) : null}
                                <div className="au-chip-label" style={{ marginBottom: '6px' }}>
                                    Step 2: Enter setup key manually
                                </div>
                                <code style={{ fontSize: '0.86rem' }}>{status.sharedKey}</code>
                            </div>
                        ) : null}
                    </div>

                    {!isExternalOnlyAccount && !status.isTwoFactorEnabled ? (
                        <div className="au-table-wrap" style={{ padding: '22px', marginBottom: '18px' }}>
                            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--color-dark)' }}>
                                Verify and Enable
                            </h3>
                            <form onSubmit={handleEnable} style={{ marginTop: '14px' }}>
                                <label htmlFor="authCode" className="au-filter-label">
                                    Step 3: Enter the 6-digit code
                                </label>
                                <input
                                    id="authCode"
                                    type="text"
                                    className="au-filter-input"
                                    value={authenticatorCode}
                                    onChange={(event) => setAuthenticatorCode(event.target.value)}
                                    required
                                />
                                <div style={{ marginTop: '16px' }}>
                                    <PrimaryButton type="submit" loading={isSubmitting} disabled={isSubmitting}>
                                        Enable MFA
                                    </PrimaryButton>
                                </div>
                            </form>
                        </div>
                    ) : !isExternalOnlyAccount ? (
                        <div className="au-table-wrap" style={{ padding: '22px', marginBottom: '18px' }}>
                            <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--color-dark)' }}>
                                Security Actions
                            </h3>
                            <p className="au-muted" style={{ margin: '8px 0 14px' }}>
                                Keep your account secure by refreshing recovery codes or disabling MFA if needed.
                            </p>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={handleResetRecoveryCodes}
                                    disabled={isSubmitting}
                                >
                                    Reset Recovery Codes
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-outline-danger"
                                    onClick={handleDisable}
                                    disabled={isSubmitting}
                                >
                                    Disable MFA
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="au-table-wrap" style={{ padding: '20px', marginBottom: '18px' }}>
                            <p className="text-muted mb-0">No local MFA actions are available for external-only accounts.</p>
                        </div>
                    )}

                    {!isExternalOnlyAccount && status.recoveryCodes && status.recoveryCodes.length > 0 ? (
                        <div className="au-table-wrap" style={{ padding: '22px', backgroundColor: 'rgba(212, 146, 122, 0.07)' }}>
                            <div style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--color-dark)' }}>
                                Recovery Codes (save these now)
                            </div>
                            <ul style={{ marginBottom: 0, columns: 2, gap: '24px' }}>
                                {status.recoveryCodes.map((code) => (
                                    <li key={code}>
                                        <code>{code}</code>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : !isExternalOnlyAccount ? (
                        <div className="au-table-wrap" style={{ padding: '16px 20px' }}>
                            <p style={{ margin: 0 }}>Recovery codes left: {status.recoveryCodesLeft}</p>
                        </div>
                    ) : null}
                </>
            ) : (
                <div className="au-table-wrap" style={{ padding: '20px' }}>
                    <p className="mb-0">Loading MFA status...</p>
                </div>
            )}
        </div>
    );
}
