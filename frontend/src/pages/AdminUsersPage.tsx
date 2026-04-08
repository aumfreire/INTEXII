import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, BadgeDollarSign, Lock, ShieldAlert, UserRound } from 'lucide-react';
import AlertBanner from '../components/ui/AlertBanner';
import PrimaryButton from '../components/ui/PrimaryButton';
import {
    adminCreateUser,
    adminResetUserMfa,
    adminResetUserPassword,
    adminUpdateUserProfile,
    adminUpdateUserRoles,
    deleteAdminUser,
    getAdminUserById,
    listAdminUsers,
} from '../lib/authAPI';
import { formatCurrency } from '../lib/formatters';
import { useAuth } from '../context/useAuth';
import type { AdminUserDetail, AdminUserSummary } from '../types/AdminUser';

type SortBy = 'email' | 'mfa' | 'donations';
type SortDirection = 'asc' | 'desc';
type RoleTemplate = 'donor' | 'admin';

export default function AdminUsersPage() {
    const { authSession } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState<AdminUserSummary[]>([]);
    const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<SortBy>('email');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const [createEmail, setCreateEmail] = useState('');
    const [createPassword, setCreatePassword] = useState('');
    const [createFirstName, setCreateFirstName] = useState('');
    const [createLastName, setCreateLastName] = useState('');
    const [createDisplayName, setCreateDisplayName] = useState('');
    const [createRoleTemplate, setCreateRoleTemplate] = useState<RoleTemplate>('donor');

    const [profileFirstName, setProfileFirstName] = useState('');
    const [profileLastName, setProfileLastName] = useState('');
    const [profileDisplayName, setProfileDisplayName] = useState('');

    const [selectedRoleTemplate, setSelectedRoleTemplate] = useState<RoleTemplate>('donor');

    const [newPassword, setNewPassword] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
    const [showDeletePrompt, setShowDeletePrompt] = useState(false);
    const [showMfaConfirm, setShowMfaConfirm] = useState(false);

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

    useEffect(() => {
        if (!selectedUser) {
            setProfileFirstName('');
            setProfileLastName('');
            setProfileDisplayName('');
            return;
        }

        setProfileFirstName(selectedUser.supporter?.firstName ?? '');
        setProfileLastName(selectedUser.supporter?.lastName ?? '');
        setProfileDisplayName(selectedUser.supporter?.displayName ?? '');
        setSelectedRoleTemplate(selectedUser.roles.includes('Admin') ? 'admin' : 'donor');
        setShowResetPasswordForm(false);
        setShowDeletePrompt(false);
        setShowMfaConfirm(false);
        setDeleteConfirmation('');
        setNewPassword('');
    }, [selectedUser]);

    const sortedUsers = useMemo(() => {
        const output = [...users];

        output.sort((left, right) => {
            let result = 0;

            if (sortBy === 'mfa') {
                result = Number(left.isTwoFactorEnabled) - Number(right.isTwoFactorEnabled);
            } else if (sortBy === 'donations') {
                result = left.totalMonetaryAmount - right.totalMonetaryAmount;
            } else {
                const leftValue = (left.email ?? '').toLowerCase();
                const rightValue = (right.email ?? '').toLowerCase();
                result = leftValue.localeCompare(rightValue);
            }

            return sortDirection === 'asc' ? result : result * -1;
        });

        return output;
    }, [sortBy, sortDirection, users]);

    const selectedUserIsExternalOnly = selectedUser?.isExternalOnly ?? false;
    const selectedUserHasGoogleLogin =
        selectedUser?.externalLoginProviders.some(
            (provider) => provider.toLowerCase() === 'google'
        ) ?? false;

    async function handleCreateUser() {
        if (!createEmail.trim() || !createPassword.trim()) {
            setErrorMessage('Email and password are required to create an account.');
            return;
        }

        setIsWorking(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            await adminCreateUser({
                email: createEmail,
                password: createPassword,
                firstName: createFirstName || undefined,
                lastName: createLastName || undefined,
                displayName: createDisplayName || undefined,
                makeAdmin: createRoleTemplate === 'admin',
            });

            setCreateEmail('');
            setCreatePassword('');
            setCreateFirstName('');
            setCreateLastName('');
            setCreateDisplayName('');
            setCreateRoleTemplate('donor');
            setShowCreateForm(false);
            await loadUsers();
            setSuccessMessage('User account created successfully.');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to create user account.');
        } finally {
            setIsWorking(false);
        }
    }

    async function handleProfileUpdate() {
        if (!selectedUser) {
            return;
        }

        setIsWorking(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            await adminUpdateUserProfile(selectedUser.id, {
                firstName: profileFirstName || undefined,
                lastName: profileLastName || undefined,
                displayName: profileDisplayName || undefined,
            });

            await loadSelectedUser(selectedUser.id);
            await loadUsers();
            setSuccessMessage('Profile details updated.');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to update profile details.');
        } finally {
            setIsWorking(false);
        }
    }

    async function handleRoleUpdate() {
        if (!selectedUser) {
            return;
        }

        const roles = selectedRoleTemplate === 'admin' ? ['Admin', 'Donor'] : ['Donor'];

        setIsWorking(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            await adminUpdateUserRoles(selectedUser.id, roles);
            await loadSelectedUser(selectedUser.id);
            await loadUsers();
            setSuccessMessage('Role assignment updated successfully.');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to update roles.');
        } finally {
            setIsWorking(false);
        }
    }

    async function handlePasswordReset() {
        if (!selectedUser) {
            return;
        }

        if (selectedUser.isExternalOnly) {
            setErrorMessage('Password reset is unavailable for external-only accounts.');
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
            setShowResetPasswordForm(false);
            setNewPassword('');
            setSuccessMessage('Password reset successfully.');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to reset password.');
        } finally {
            setIsWorking(false);
        }
    }

    async function handleMfaReset() {
        if (!selectedUser) {
            return;
        }

        if (selectedUser.isExternalOnly) {
            setErrorMessage('MFA reset is unavailable for external-only accounts.');
            return;
        }

        setIsWorking(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            await adminResetUserMfa(selectedUser.id);
            setShowMfaConfirm(false);
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
            setSelectedUserId(null);
            setDeleteConfirmation('');
            setShowDeletePrompt(false);
            await loadUsers();
            setSuccessMessage('User deleted successfully.');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to delete user.');
        } finally {
            setIsWorking(false);
        }
    }

    return (
        <div className="container py-5">
            <div className="login-card" style={{ maxWidth: '1320px' }}>
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
                    <div>
                        <h2 className="mb-2">Manage Users</h2>
                        <p className="login-subtitle mb-0">
                            Create accounts, assign roles, maintain supporter profiles, and manage security operations.
                        </p>
                    </div>
                    <Link to="/admin" className="btn btn-outline-secondary">
                        Back to Admin Dashboard
                    </Link>
                </div>

                {errorMessage ? (
                    <AlertBanner message={errorMessage} type="warning" onClose={() => setErrorMessage('')} />
                ) : null}
                {successMessage ? (
                    <AlertBanner message={successMessage} type="success" onClose={() => setSuccessMessage('')} />
                ) : null}

                <div className="border rounded-3 p-3 mb-4 bg-light">
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2">
                        <div>
                            <h5 className="mb-1">Create Account</h5>
                            <div className="small text-muted">New accounts are automatically assigned the Donor role.</div>
                        </div>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={() => setShowCreateForm((prev) => !prev)}
                        >
                            {showCreateForm ? 'Close Form' : 'Create User'}
                        </button>
                    </div>

                    {showCreateForm ? (
                        <div className="row g-2 mt-2">
                            <div className="col-12 col-md-6">
                                <input
                                    className="form-control"
                                    type="email"
                                    value={createEmail}
                                    onChange={(event) => setCreateEmail(event.target.value)}
                                    placeholder="Email"
                                />
                            </div>
                            <div className="col-12 col-md-6">
                                <input
                                    className="form-control"
                                    type="password"
                                    value={createPassword}
                                    onChange={(event) => setCreatePassword(event.target.value)}
                                    placeholder="Password (min 14 chars)"
                                />
                            </div>
                            <div className="col-12 col-md-4">
                                <input
                                    className="form-control"
                                    value={createFirstName}
                                    onChange={(event) => setCreateFirstName(event.target.value)}
                                    placeholder="First name"
                                />
                            </div>
                            <div className="col-12 col-md-4">
                                <input
                                    className="form-control"
                                    value={createLastName}
                                    onChange={(event) => setCreateLastName(event.target.value)}
                                    placeholder="Last name"
                                />
                            </div>
                            <div className="col-12 col-md-4">
                                <input
                                    className="form-control"
                                    value={createDisplayName}
                                    onChange={(event) => setCreateDisplayName(event.target.value)}
                                    placeholder="Display name"
                                />
                            </div>
                            <div className="col-12 col-md-4">
                                <select
                                    className="form-select"
                                    value={createRoleTemplate}
                                    onChange={(event) => setCreateRoleTemplate(event.target.value as RoleTemplate)}
                                >
                                    <option value="donor">Donor</option>
                                    <option value="admin">Admin + Donor</option>
                                </select>
                            </div>
                            <div className="col-12 col-md-8 d-flex justify-content-md-end">
                                <PrimaryButton type="button" onClick={handleCreateUser} loading={isWorking} disabled={isWorking}>
                                    Save New Account
                                </PrimaryButton>
                            </div>
                        </div>
                    ) : null}
                </div>

                <div className="d-flex flex-wrap gap-2 mb-3">
                    <input
                        type="search"
                        className="form-control"
                        style={{ maxWidth: '320px' }}
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Search email or display name"
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
                        <option value="mfa">Sort by MFA</option>
                        <option value="donations">Sort by Donations</option>
                    </select>
                    <select
                        className="form-select"
                        style={{ maxWidth: '150px' }}
                        value={sortDirection}
                        onChange={(event) => setSortDirection(event.target.value as SortDirection)}
                    >
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>

                <div className="row g-4">
                    <div className="col-12 col-xl-7">
                        <div className="table-responsive border rounded-3 shadow-sm">
                            <table className="table align-middle mb-0 bg-white">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>MFA</th>
                                        <th>Monetary Total</th>
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
                                                        ? 'rgba(206, 50, 91, 0.10)'
                                                        : 'transparent',
                                            }}
                                        >
                                            <td>
                                                <div className="fw-semibold">{user.preferredDisplayName}</div>
                                                <small className="text-muted">{user.email ?? 'No email'}</small>
                                                {user.externalLoginProviders.some(
                                                    (provider) => provider.toLowerCase() === 'google'
                                                ) ? (
                                                    <div>
                                                        <span className="badge text-bg-light border mt-1">Google Sign-In</span>
                                                    </div>
                                                ) : null}
                                            </td>
                                            <td>{user.roles.includes('Admin') ? 'Admin + Donor' : 'Donor'}</td>
                                            <td>
                                                <span className={user.isTwoFactorEnabled ? 'text-success' : 'text-muted'}>
                                                    {user.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </td>
                                            <td>{formatCurrency(user.totalMonetaryAmount)}</td>
                                        </tr>
                                    ))}
                                    {!isLoading && sortedUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-4 text-muted">
                                                No users found.
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="col-12 col-xl-5">
                        <div className="border rounded-3 p-3 bg-white shadow-sm h-100">
                            <h5 className="mb-3">User Detail</h5>
                            {!selectedUser ? (
                                <p className="text-muted mb-0">Select a user to view details.</p>
                            ) : (
                                <>
                                    <div className="d-flex align-items-center gap-2 mb-1">
                                        <UserRound size={16} />
                                        <span className="fw-semibold">{selectedUser.preferredDisplayName}</span>
                                    </div>
                                    <div className="small text-muted mb-3">{selectedUser.email ?? 'No email'}</div>
                                    <div className="d-flex flex-wrap gap-2 mb-3">
                                        {selectedUserHasGoogleLogin ? (
                                            <span className="badge text-bg-light border">Google Sign-In</span>
                                        ) : null}
                                        {selectedUserIsExternalOnly ? (
                                            <span className="badge text-bg-warning">External-only account</span>
                                        ) : (
                                            <span className="badge text-bg-light border">Local password account</span>
                                        )}
                                    </div>

                                    <div className="border rounded-3 p-2 mb-3 bg-light">
                                        <div className="fw-semibold mb-2">Role Assignment</div>
                                        <div className="small text-muted mb-2">
                                            Admin implies Donor access automatically.
                                        </div>
                                        <select
                                            className="form-select mb-2"
                                            value={selectedRoleTemplate}
                                            onChange={(event) => setSelectedRoleTemplate(event.target.value as RoleTemplate)}
                                            disabled={
                                                selectedUser.email === authSession.email &&
                                                selectedUser.roles.includes('Admin')
                                            }
                                        >
                                            <option value="donor">Donor</option>
                                            <option value="admin">Admin + Donor</option>
                                        </select>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm"
                                            disabled={isWorking}
                                            onClick={() => void handleRoleUpdate()}
                                        >
                                            Save Role Assignment
                                        </button>
                                    </div>

                                    <div className="row g-2 mb-3">
                                        <SummaryPill label="MFA" value={selectedUser.isTwoFactorEnabled ? 'Enabled' : 'Disabled'} icon={<ShieldAlert size={14} />} />
                                        <SummaryPill label="Access Fails" value={selectedUser.accessFailedCount.toString()} icon={<Lock size={14} />} />
                                        <SummaryPill label="Donations" value={selectedUser.donationSummary.totalDonationCount.toString()} icon={<BadgeDollarSign size={14} />} />
                                        <SummaryPill label="Monetary" value={formatCurrency(selectedUser.donationSummary.totalMonetaryAmount)} icon={<BadgeDollarSign size={14} />} />
                                    </div>

                                    <div className="border rounded-3 p-2 mb-3 bg-light">
                                        <div className="fw-semibold mb-2">Name & Supporter Profile</div>
                                        <div className="row g-2">
                                            <div className="col-12 col-md-6">
                                                <label className="form-label mb-1">First Name</label>
                                                <input
                                                    className="form-control"
                                                    value={profileFirstName}
                                                    onChange={(event) => setProfileFirstName(event.target.value)}
                                                />
                                            </div>
                                            <div className="col-12 col-md-6">
                                                <label className="form-label mb-1">Last Name</label>
                                                <input
                                                    className="form-control"
                                                    value={profileLastName}
                                                    onChange={(event) => setProfileLastName(event.target.value)}
                                                />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label mb-1">Display Name</label>
                                                <input
                                                    className="form-control"
                                                    value={profileDisplayName}
                                                    onChange={(event) => setProfileDisplayName(event.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary btn-sm mt-2"
                                            onClick={() => void handleProfileUpdate()}
                                            disabled={isWorking}
                                        >
                                            Save Name Details
                                        </button>
                                    </div>

                                    <div className="border rounded-3 p-2 mb-3">
                                        <div className="d-flex justify-content-between align-items-center gap-2 mb-2">
                                            <div className="fw-semibold">Recent Donations</div>
                                            {selectedUser.supporter?.supporterId && selectedUser.donationSummary.totalDonationCount > selectedUser.recentDonations.length ? (
                                                <Link
                                                    to={`/admin/donations?supporterId=${selectedUser.supporter.supporterId}&supporterName=${encodeURIComponent(selectedUser.supporter.displayName ?? selectedUser.preferredDisplayName)}`}
                                                    className="btn btn-outline-primary btn-sm"
                                                >
                                                    View full history
                                                </Link>
                                            ) : null}
                                        </div>
                                        {selectedUser.recentDonations.length === 0 ? (
                                            <div className="small text-muted">No donation history linked to this supporter.</div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="table table-sm mb-0">
                                                    <thead>
                                                        <tr>
                                                            <th>Date</th>
                                                            <th>Type</th>
                                                            <th className="text-end">Amount</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {selectedUser.recentDonations.map((donation) => (
                                                            <tr key={donation.donationId}>
                                                                <td>{donation.donationDate ?? '-'}</td>
                                                                <td>{donation.donationType ?? 'Unknown'}</td>
                                                                <td className="text-end">{formatCurrency(donation.amount ?? 0)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>

                                    <div className="border border-danger rounded-3 p-3 bg-light">
                                        <div className="d-flex align-items-center gap-2 mb-2 text-danger fw-semibold">
                                            <AlertTriangle size={16} />
                                            Danger Zone
                                        </div>
                                        <div className="small text-muted mb-3">
                                            Sensitive actions are intentionally hidden behind explicit confirmation steps.
                                        </div>

                                        {selectedUserIsExternalOnly ? (
                                            <div className="alert alert-warning py-2 mb-3">
                                                Password and MFA reset are disabled because this user authenticates via an external provider.
                                            </div>
                                        ) : null}

                                        <div className="d-flex flex-wrap gap-2 mb-2">
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => setShowResetPasswordForm((prev) => !prev)}
                                                disabled={selectedUserIsExternalOnly}
                                            >
                                                {showResetPasswordForm ? 'Hide Password Reset' : 'Reveal Password Reset'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => setShowMfaConfirm((prev) => !prev)}
                                                disabled={selectedUserIsExternalOnly}
                                            >
                                                {showMfaConfirm ? 'Cancel MFA Reset' : 'Reveal MFA Reset'}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn btn-outline-danger btn-sm"
                                                onClick={() => setShowDeletePrompt((prev) => !prev)}
                                            >
                                                {showDeletePrompt ? 'Cancel Delete' : 'Reveal Delete Account'}
                                            </button>
                                        </div>

                                        {showResetPasswordForm && !selectedUserIsExternalOnly ? (
                                            <div className="mb-3 border rounded p-2 bg-white">
                                                <label className="form-label mb-1">New Password</label>
                                                <input
                                                    className="form-control"
                                                    type="password"
                                                    value={newPassword}
                                                    onChange={(event) => setNewPassword(event.target.value)}
                                                    placeholder="Minimum 14 characters"
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm mt-2"
                                                    onClick={() => void handlePasswordReset()}
                                                    disabled={isWorking}
                                                >
                                                    Confirm Password Reset
                                                </button>
                                            </div>
                                        ) : null}

                                        {showMfaConfirm && !selectedUserIsExternalOnly ? (
                                            <div className="mb-3 border rounded p-2 bg-white">
                                                <div className="small mb-2">This will force the user to set up MFA again.</div>
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => void handleMfaReset()}
                                                    disabled={isWorking}
                                                >
                                                    Confirm MFA Reset
                                                </button>
                                            </div>
                                        ) : null}

                                        {showDeletePrompt ? (
                                            <div className="border rounded p-2 bg-white">
                                                <label className="form-label mb-1">Type email to confirm delete</label>
                                                <input
                                                    className="form-control"
                                                    value={deleteConfirmation}
                                                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                                                    placeholder={selectedUser.email ?? ''}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-danger btn-sm mt-2"
                                                    onClick={() => void handleDeleteUser()}
                                                    disabled={isWorking}
                                                >
                                                    Permanently Delete Account
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

type SummaryPillProps = {
    label: string;
    value: string;
    icon: ReactNode;
};

function SummaryPill({ label, value, icon }: SummaryPillProps) {
    return (
        <div className="col-6">
            <div className="border rounded-3 p-2 h-100">
                <div className="d-flex align-items-center gap-1 small text-muted mb-1">
                    {icon}
                    <span>{label}</span>
                </div>
                <div className="fw-semibold">{value}</div>
            </div>
        </div>
    );
}
