import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import AlertBanner from '../components/ui/AlertBanner';
import PrimaryButton from '../components/ui/PrimaryButton';
import { updatePassword } from '../lib/authAPI';
import { useAuth } from '../context/useAuth';

export default function EditProfilePage() {
    const { authSession } = useAuth();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        if (newPassword.length < 14) {
            setErrorMessage('New password must be at least 14 characters.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMessage('New password and confirmation must match.');
            return;
        }

        setIsSubmitting(true);

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
            setIsSubmitting(false);
        }
    }

    return (
        <div className="container" style={{ padding: '48px 24px' }}>
            <div className="login-card" style={{ maxWidth: '680px' }}>
                <h2>Edit Profile</h2>
                <p className="login-subtitle">
                    Signed in as {authSession.email ?? authSession.userName ?? 'user'}.
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

                <form onSubmit={handleSubmit}>
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

                    <PrimaryButton type="submit" loading={isSubmitting} disabled={isSubmitting}>
                        Save Password
                    </PrimaryButton>
                </form>

                <div style={{ marginTop: '20px' }}>
                    <Link to="/mfa" className="btn btn-outline-secondary">
                        Manage MFA
                    </Link>
                </div>
            </div>
        </div>
    );
}
