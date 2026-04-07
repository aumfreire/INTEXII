import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AlertBanner from '../components/ui/AlertBanner';
import PrimaryButton from '../components/ui/PrimaryButton';
import {
    getManagedProfile,
    updateManagedProfile,
    updatePassword,
} from '../lib/authAPI';
import { useAuth } from '../context/useAuth';

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

        if (newPassword.length < 14) {
            setErrorMessage('New password must be at least 14 characters.');
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
        <div className="container" style={{ padding: '48px 24px' }}>
            <div className="login-card" style={{ maxWidth: '820px' }}>
                <h2>Edit Profile</h2>
                <p className="login-subtitle">
                    Signed in as {authSession.email ?? authSession.userName ?? 'user'}.
                </p>

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

                <div className="border rounded-3 p-3 bg-light mb-3">
                    <h5 className="mb-2">Profile Identity</h5>
                    <p className="text-muted small mb-3">
                        Keep your donor information current. Display name is used across dashboard and admin views.
                    </p>

                    {isLoadingProfile ? (
                        <p className="mb-0">Loading profile details...</p>
                    ) : (
                        <form onSubmit={handleProfileSubmit}>
                            <div className="row g-2">
                                <div className="col-12 col-md-6">
                                    <label htmlFor="firstName" className="form-label">
                                        First Name
                                    </label>
                                    <input
                                        id="firstName"
                                        className="form-control"
                                        value={firstName}
                                        onChange={(event) => setFirstName(event.target.value)}
                                    />
                                </div>
                                <div className="col-12 col-md-6">
                                    <label htmlFor="lastName" className="form-label">
                                        Last Name
                                    </label>
                                    <input
                                        id="lastName"
                                        className="form-control"
                                        value={lastName}
                                        onChange={(event) => setLastName(event.target.value)}
                                    />
                                </div>
                                <div className="col-12">
                                    <label htmlFor="displayName" className="form-label">
                                        Display Name
                                    </label>
                                    <input
                                        id="displayName"
                                        className="form-control"
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

                <div className="border rounded-3 p-3 mb-3">
                    <h5 className="mb-2">Credential Management</h5>
                    {isExternalOnlyAccount ? (
                        <div className="alert alert-warning mb-0">
                            Password changes are disabled because this account uses external sign-in ({providerList || 'provider-managed'}).
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordSubmit}>
                            <div style={{ marginBottom: '12px' }}>
                                <label htmlFor="oldPassword" className="form-label">
                                    Current Password
                                </label>
                                <input
                                    id="oldPassword"
                                    type="password"
                                    className="form-control"
                                    value={oldPassword}
                                    onChange={(event) => setOldPassword(event.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <label htmlFor="newPassword" className="form-label">
                                    New Password
                                </label>
                                <input
                                    id="newPassword"
                                    type="password"
                                    className="form-control"
                                    value={newPassword}
                                    onChange={(event) => setNewPassword(event.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ marginBottom: '18px' }}>
                                <label htmlFor="confirmPassword" className="form-label">
                                    Confirm New Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    type="password"
                                    className="form-control"
                                    value={confirmPassword}
                                    onChange={(event) => setConfirmPassword(event.target.value)}
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
        </div>
    );
}
