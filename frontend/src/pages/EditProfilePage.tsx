import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Settings, ShieldCheck, UserRound } from 'lucide-react';
import AlertBanner from '../components/ui/AlertBanner';
import PrimaryButton from '../components/ui/PrimaryButton';
import { PASSWORD_POLICY_MESSAGE, meetsPasswordPolicy } from '../lib/passwordPolicy';
import {
    getManagedProfile,
    updateManagedProfile,
    updatePassword,
} from '../lib/authAPI';
import { useAuth } from '../context/useAuth';
import '../styles/pages/admin-dashboard.css';
import '../styles/pages/admin-users.css';

export default function EditProfilePage() {
    const { authSession } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const isExternalOnlyAccount = authSession.isExternalOnly;
    const providerList = authSession.externalLoginProviders.join(', ');

    useEffect(() => {
        void loadProfile();
    }, []);

    async function loadProfile() {
        setIsLoadingProfile(true);
        setErrorMessage('');

        try {
            const profile = await getManagedProfile();
            setFirstName(profile.firstName ?? '');
            setLastName(profile.lastName ?? '');
            setDisplayName(profile.displayName ?? '');
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : 'Unable to load profile details.'
            );
        } finally {
            setIsLoadingProfile(false);
        }
    }

    async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        setIsSavingProfile(true);

        try {
            const profile = await updateManagedProfile({
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                displayName: displayName || undefined,
            });

            setFirstName(profile.firstName ?? '');
            setLastName(profile.lastName ?? '');
            setDisplayName(profile.displayName ?? '');
            setSuccessMessage('Profile details updated successfully.');
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : 'Unable to update profile details.'
            );
        } finally {
            setIsSavingProfile(false);
        }
    }

    async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (isExternalOnlyAccount) {
            setErrorMessage('Password is managed by your external sign-in provider.');
            return;
        }

        if (!meetsPasswordPolicy(newPassword)) {
            setErrorMessage(PASSWORD_POLICY_MESSAGE);
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('New password and confirmation must match.');
            return;
        }

        setIsSavingPassword(true);

        try {
            await updatePassword(oldPassword, newPassword);
            setSuccessMessage('Password updated successfully.');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : 'Unable to update password.'
            );
        } finally {
            setIsSavingPassword(false);
        }
    }

    return (
        <div className="container" style={{ maxWidth: '1240px', padding: '40px 24px' }}>
            <div className="admin-page-header" style={{ marginBottom: '20px' }}>
                <h1 className="admin-page-title">Edit My Profile</h1>
                <p className="admin-page-subtitle">
                    Signed in as {authSession.email ?? authSession.userName ?? 'user'}.
                </p>
                <div style={{ marginTop: '10px' }}>
                    <Link to="/dashboard" className="dash-panel-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <ChevronLeft size={14} />
                        Back to Dashboard
                    </Link>
                </div>
            </div>

            <div className="au-summary" style={{ marginBottom: '20px' }}>
                <div className="au-chip">
                    <div className="au-chip-icon default"><UserRound size={20} /></div>
                    <div><div className="au-chip-value">Profile</div><div className="au-chip-label">Identity Settings</div></div>
                </div>
                <div className="au-chip">
                    <div className="au-chip-icon mfa"><ShieldCheck size={20} /></div>
                    <div><div className="au-chip-value">{isExternalOnlyAccount ? 'Provider' : 'Local'}</div><div className="au-chip-label">Sign-in Method</div></div>
                </div>
                <div className="au-chip">
                    <div className="au-chip-icon admin"><Settings size={20} /></div>
                    <div><div className="au-chip-value">Account</div><div className="au-chip-label">Security Controls</div></div>
                </div>
            </div>

            <div className="d-flex flex-wrap gap-2 mb-3">
                {isExternalOnlyAccount ? (
                    <span className="badge text-bg-warning">External Sign-In Account</span>
                ) : (
                    <span className="badge text-bg-light border">Local Password Account</span>
                )}
                {authSession.externalLoginProviders.map((provider) => (
                    <span key={provider} className="badge text-bg-light border">
                        {provider}
                    </span>
                ))}
            </div>

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

            <div className="au-table-wrap" style={{ padding: '22px', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--color-dark)' }}>Profile Identity</h3>
                <p className="au-muted" style={{ margin: '8px 0 16px' }}>
                    Keep your donor information current. Display name is used across dashboard and admin views.
                </p>

                {isLoadingProfile ? (
                    <p className="mb-0">Loading profile details...</p>
                ) : (
                    <form onSubmit={handleProfileSubmit}>
                        <div className="au-grid-2">
                            <div>
                                <label htmlFor="firstName" className="au-filter-label">
                                    First Name
                                </label>
                                <input
                                    id="firstName"
                                    className="au-filter-input"
                                    value={firstName}
                                    onChange={(event) => setFirstName(event.target.value)}
                                />
                            </div>
                            <div>
                                <label htmlFor="lastName" className="au-filter-label">
                                    Last Name
                                </label>
                                <input
                                    id="lastName"
                                    className="au-filter-input"
                                    value={lastName}
                                    onChange={(event) => setLastName(event.target.value)}
                                />
                            </div>
                            <div className="au-grid-full">
                                <label htmlFor="displayName" className="au-filter-label">
                                    Display Name
                                </label>
                                <input
                                    id="displayName"
                                    className="au-filter-input"
                                    value={displayName}
                                    onChange={(event) => setDisplayName(event.target.value)}
                                    placeholder="How your name should appear in the app"
                                />
                            </div>
                        </div>

                        <div className="mt-3">
                            <PrimaryButton
                                type="submit"
                                loading={isSavingProfile}
                                disabled={isSavingProfile}
                            >
                                Save Profile Details
                            </PrimaryButton>
                        </div>
                    </form>
                )}
            </div>

            <div className="au-table-wrap" style={{ padding: '22px', marginBottom: '18px' }}>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-heading)', fontSize: '1.05rem', color: 'var(--color-dark)' }}>Credential Management</h3>
                {isExternalOnlyAccount ? (
                    <div className="alert alert-warning mb-0" style={{ marginTop: '12px' }}>
                        Password changes are disabled because this account uses external sign-in ({providerList || 'provider-managed'}).
                    </div>
                ) : (
                    <form onSubmit={handlePasswordSubmit} style={{ marginTop: '12px' }}>
                        <div style={{ marginBottom: '12px' }}>
                            <label htmlFor="oldPassword" className="au-filter-label">
                                Current Password
                            </label>
                            <input
                                id="oldPassword"
                                type="password"
                                className="au-filter-input"
                                value={oldPassword}
                                onChange={(event) => setOldPassword(event.target.value)}
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '12px' }}>
                            <label htmlFor="newPassword" className="au-filter-label">
                                New Password
                            </label>
                            <input
                                id="newPassword"
                                type="password"
                                className="au-filter-input"
                                value={newPassword}
                                onChange={(event) => setNewPassword(event.target.value)}
                                minLength={14}
                                autoComplete="new-password"
                                required
                            />
                        </div>
                        <div style={{ marginBottom: '18px' }}>
                            <label htmlFor="confirmPassword" className="au-filter-label">
                                Confirm New Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                className="au-filter-input"
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>

                        <PrimaryButton
                            type="submit"
                            loading={isSavingPassword}
                            disabled={isSavingPassword}
                        >
                            Save Password
                        </PrimaryButton>
                    </form>
                )}
            </div>

            <div style={{ marginTop: '20px' }}>
                <Link to="/mfa" className="btn btn-outline-secondary">
                    Manage MFA
                </Link>
            </div>
        </div>
    );
}
