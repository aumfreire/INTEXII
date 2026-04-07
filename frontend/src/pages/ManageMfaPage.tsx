import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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

export default function ManageMfaPage() {
    const { authSession } = useAuth();
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

    return (
        <div className="container" style={{ padding: '48px 24px' }}>
            <div className="login-card" style={{ maxWidth: '760px' }}>
                <h2>Authenticator MFA</h2>
                <p className="login-subtitle">
                    Configure optional multi-factor authentication for {authSession.email ?? 'your account'}.
                </p>

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
                        <p>
                            MFA status:{' '}
                            <strong>
                                {status.isTwoFactorEnabled ? 'Enabled' : 'Not enabled'}
                            </strong>
                        </p>
                        {status.sharedKey ? (
                            <div className="alert alert-light border" style={{ marginBottom: '16px' }}>
                                <div style={{ fontWeight: 600, marginBottom: '6px' }}>
                                    Step 1: Scan QR code in your authenticator app
                                </div>
                                {qrValue ? (
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            marginBottom: '12px',
                                        }}
                                    >
                                        <QRCodeSVG
                                            value={qrValue}
                                            size={180}
                                            includeMargin
                                        />
                                    </div>
                                ) : null}
                                <div style={{ fontWeight: 600, marginBottom: '6px' }}>
                                    Step 2: Or enter this setup key manually
                                </div>
                                <code>{status.sharedKey}</code>
                            </div>
                        ) : null}

                        {!status.isTwoFactorEnabled ? (
                            <form onSubmit={handleEnable}>
                                <label htmlFor="authCode" style={{ display: 'block', marginBottom: '8px' }}>
                                    Step 3: Enter the 6-digit code from your authenticator app
                                </label>
                                <input
                                    id="authCode"
                                    type="text"
                                    className="form-control"
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
                        ) : (
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
                        )}

                        {status.recoveryCodes && status.recoveryCodes.length > 0 ? (
                            <div className="alert alert-warning" style={{ marginTop: '20px' }}>
                                <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                                    Recovery Codes
                                </div>
                                <ul style={{ marginBottom: 0 }}>
                                    {status.recoveryCodes.map((code) => (
                                        <li key={code}>
                                            <code>{code}</code>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ) : (
                            <p style={{ marginTop: '16px' }}>
                                Recovery codes left: {status.recoveryCodesLeft}
                            </p>
                        )}
                    </>
                ) : (
                    <p>Loading MFA status...</p>
                )}
            </div>
        </div>
    );
}
