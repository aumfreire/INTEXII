import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import AlertBanner from '../components/ui/AlertBanner';
import PrimaryButton from '../components/ui/PrimaryButton';
import {
    adminResetUserMfa,
    adminResetUserPassword,
    deleteAdminUser,
    getAdminUserById,
    listAdminUsers,
} from '../lib/authAPI';
import type { AdminUserDetail, AdminUserSummary } from '../types/AdminUser';

type SortBy = 'email' | 'userName' | 'mfa';
type SortDirection = 'asc' | 'desc';

export default function AdminUsersPage() {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<AdminUserSummary[]>([]);
    const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortBy>('email');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [newPassword, setNewPassword] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isWorking, setIsWorking] = useState(false);

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await listAdminUsers(searchTerm);
            setUsers(response);

            if (response.length === 0) {
                setSelectedUserId(null);
                return;
            }

            if (!selectedUserId || !response.some((user) => user.id === selectedUserId)) {
                setSelectedUserId(response[0].id);
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to load users.');
        } finally {
            setIsLoading(false);
        }
    }, [searchTerm, selectedUserId]);

    const loadSelectedUser = useCallback(async (userId: string) => {
        setErrorMessage('');

        try {
            const response = await getAdminUserById(userId);
            setSelectedUser(response);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Unable to load selected user details.'
            );
        }
    }, []);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    useEffect(() => {
        if (!selectedUserId) {
            setSelectedUser(null);
            return;
        }

        void loadSelectedUser(selectedUserId);
    }, [loadSelectedUser, selectedUserId]);

    const sortedUsers = useMemo(() => {
        const output = [...users];

        output.sort((left, right) => {
            let result = 0;

            if (sortBy === 'mfa') {
                result = Number(left.isTwoFactorEnabled) - Number(right.isTwoFactorEnabled);
            } else {
                const leftValue = (left[sortBy] ?? '').toString().toLowerCase();
                const rightValue = (right[sortBy] ?? '').toString().toLowerCase();
                result = leftValue.localeCompare(rightValue);
            }

            return sortDirection === 'asc' ? result : result * -1;
        });

        return output;
    }, [sortBy, sortDirection, users]);

    async function handlePasswordReset() {
        if (!selectedUser) {
            return;
        }

        if (newPassword.length < 14) {
            setErrorMessage('Password must be at least 14 characters.');
            return;
        }

        setIsWorking(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            await adminResetUserPassword(selectedUser.id, newPassword);
            setSuccessMessage('Password reset successfully.');
            setNewPassword('');
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : 'Unable to reset password.'
            );
        } finally {
            setIsWorking(false);
        }
    }

    async function handleMfaReset() {
        if (!selectedUser) {
            return;
        }

        setIsWorking(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            await adminResetUserMfa(selectedUser.id);
            await loadSelectedUser(selectedUser.id);
            await loadUsers();
            setSuccessMessage('MFA reset successfully.');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to reset MFA.');
        } finally {
            setIsWorking(false);
        }
    }

    async function handleDeleteUser() {
        if (!selectedUser) {
            return;
        }

        const requiredValue = (selectedUser.email ?? selectedUser.userName ?? '').toLowerCase();
        if (deleteConfirmation.trim().toLowerCase() !== requiredValue) {
            setErrorMessage('Type the selected user email exactly to confirm deletion.');
            return;
        }

        setIsWorking(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            await deleteAdminUser(selectedUser.id);
            setSuccessMessage('User deleted successfully.');
            setDeleteConfirmation('');
            setSelectedUserId(null);
            await loadUsers();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to delete user.');
        } finally {
            setIsWorking(false);
        }
    }

    return (
        <div className="container" style={{ padding: '48px 24px' }}>
            <div className="login-card" style={{ maxWidth: '1100px' }}>
                <h2>Manage Users</h2>
                <p className="login-subtitle">
                    Search, review, and manage user access controls and security settings.
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

                <div
                    style={{
                        display: 'flex',
                        gap: '12px',
                        flexWrap: 'wrap',
                        marginBottom: '18px',
                    }}
                >
                    <input
                        type="search"
                        className="form-control"
                        style={{ maxWidth: '360px' }}
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search by email or username"
                    />
                    <button type="button" className="btn btn-outline-secondary" onClick={() => void loadUsers()}>
                        Search
                    </button>
                    <select
                        className="form-select"
                        style={{ maxWidth: '180px' }}
                        value={sortBy}
                        onChange={(event) => setSortBy(event.target.value as SortBy)}
                    >
                        <option value="email">Sort by Email</option>
                        <option value="userName">Sort by Username</option>
                        <option value="mfa">Sort by MFA</option>
                    </select>
                    <select
                        className="form-select"
                        style={{ maxWidth: '140px' }}
                        value={sortDirection}
                        onChange={(event) => setSortDirection(event.target.value as SortDirection)}
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>

                <div className="row g-4">
                    <div className="col-12 col-lg-7">
                        <div className="table-responsive border rounded">
                            <table className="table align-middle mb-0 bg-white">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Roles</th>
                                        <th>MFA</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedUsers.map((user) => (
                                        <tr
                                            key={user.id}
                                            onClick={() => setSelectedUserId(user.id)}
                                            style={{
                                                cursor: 'pointer',
                                                backgroundColor:
                                                    selectedUserId === user.id
                                                        ? 'rgba(0, 123, 255, 0.08)'
                                                        : 'transparent',
                                            }}
                                        >
                                            <td>{user.email ?? user.userName ?? 'Unknown'}</td>
                                            <td>{user.roles.join(', ') || 'None'}</td>
                                            <td>{user.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}</td>
                                        </tr>
                                    ))}
                                    {!isLoading && sortedUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="text-center py-4 text-muted">
                                                No users found.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="col-12 col-lg-5">
                        <div className="border rounded p-3 bg-white h-100">
                            <h5 style={{ marginBottom: '12px' }}>User Details</h5>
                            {!selectedUser ? (
                                <p className="text-muted mb-0">Select a user to view details.</p>
                            ) : (
                                <>
                                    <p><strong>Email:</strong> {selectedUser.email ?? 'N/A'}</p>
                                    <p><strong>Username:</strong> {selectedUser.userName ?? 'N/A'}</p>
                                    <p><strong>Roles:</strong> {selectedUser.roles.join(', ') || 'None'}</p>
                                    <p><strong>Email Confirmed:</strong> {selectedUser.emailConfirmed ? 'Yes' : 'No'}</p>
                                    <p><strong>MFA:</strong> {selectedUser.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}</p>
                                    <p><strong>Recovery Codes Left:</strong> {selectedUser.recoveryCodesLeft}</p>
                                    <p><strong>Failed Access Count:</strong> {selectedUser.accessFailedCount}</p>

                                    <hr />

                                    <label className="form-label" htmlFor="newPassword">
                                        Reset Password
                                    </label>
                                    <input
                                        id="newPassword"
                                        className="form-control"
                                        type="password"
                                        value={newPassword}
                                        onChange={(event) => setNewPassword(event.target.value)}
                                        placeholder="Minimum 14 characters"
                                    />
                                    <div style={{ marginTop: '10px', marginBottom: '14px' }}>
                                        <PrimaryButton
                                            type="button"
                                            onClick={handlePasswordReset}
                                            disabled={isWorking}
                                            loading={isWorking}
                                        >
                                            Reset Password
                                        </PrimaryButton>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => void handleMfaReset()}
                                        disabled={isWorking}
                                    >
                                        Reset MFA
                                    </button>

                                    <hr />

                                    <label className="form-label" htmlFor="deleteConfirm">
                                        Confirm Delete (type email)
                                    </label>
                                    <input
                                        id="deleteConfirm"
                                        className="form-control"
                                        type="text"
                                        value={deleteConfirmation}
                                        onChange={(event) => setDeleteConfirmation(event.target.value)}
                                        placeholder={selectedUser.email ?? selectedUser.userName ?? ''}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-danger"
                                        style={{ marginTop: '10px' }}
                                        onClick={() => void handleDeleteUser()}
                                        disabled={isWorking}
                                    >
                                        Delete User
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '18px' }}>
                    <Link to="/admin" className="btn btn-outline-secondary">
                        Back to Admin Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
