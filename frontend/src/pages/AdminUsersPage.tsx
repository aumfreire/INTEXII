import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import {
    AlertTriangle,
    BadgeDollarSign,
    Lock,
    Search,
    ShieldCheck,
    UserCog,
    UserPlus,
    X,
} from 'lucide-react';
import AlertBanner from '../components/ui/AlertBanner';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
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
import '../styles/pages/admin-users.css';

type SortBy = 'email' | 'mfa' | 'donations';
type SortDirection = 'asc' | 'desc';
type RoleTemplate = 'donor' | 'admin';

export default function AdminUsersPage() {
    const { authSession } = useAuth();
    const [users, setUsers] = useState<AdminUserSummary[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);

    const [searchInput, setSearchInput] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('email');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const [isLoading, setIsLoading] = useState(true);
    const [isWorking, setIsWorking] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [createOpen, setCreateOpen] = useState(false);
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

    const [showResetPasswordForm, setShowResetPasswordForm] = useState(false);
    const [showDeletePrompt, setShowDeletePrompt] = useState(false);
    const [showMfaConfirm, setShowMfaConfirm] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState('');

    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await listAdminUsers(activeSearch);
            setUsers(response);

            if (response.length === 0) {
                setSelectedUserId(null);
                setSelectedUser(null);
            } else if (selectedUserId && !response.some((u) => u.id === selectedUserId)) {
                setSelectedUserId(response[0].id);
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to load users.');
        } finally {
            setIsLoading(false);
        }
    }, [activeSearch, selectedUserId]);

    const loadSelectedUser = useCallback(async (userId: string) => {
        setErrorMessage('');
        try {
            const detail = await getAdminUserById(userId);
            setSelectedUser(detail);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to load selected user details.');
        }
    }, []);

    useEffect(() => {
        void loadUsers();
    }, [loadUsers]);

    useEffect(() => {
        if (!selectedUserId) {
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
        setProfileDisplayName(selectedUser.supporter?.displayName ?? selectedUser.preferredDisplayName);
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
                result = (left.email ?? '').toLowerCase().localeCompare((right.email ?? '').toLowerCase());
            }

            return sortDirection === 'asc' ? result : result * -1;
        });

        return output;
    }, [sortBy, sortDirection, users]);

    const metrics = useMemo(() => {
        const totalUsers = users.length;
        const adminUsers = users.filter((u) => u.roles.includes('Admin')).length;
        const mfaEnabled = users.filter((u) => u.isTwoFactorEnabled).length;
        const monetaryTotal = users.reduce((sum, u) => sum + u.totalMonetaryAmount, 0);

        return { totalUsers, adminUsers, mfaEnabled, monetaryTotal };
    }, [users]);

    const selectedUserIsExternalOnly = selectedUser?.isExternalOnly ?? false;
    const selectedUserHasGoogleLogin =
        selectedUser?.externalLoginProviders.some((provider) => provider.toLowerCase() === 'google') ?? false;

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
            setCreateOpen(false);
            await loadUsers();
            setSuccessMessage('User account created successfully.');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to create user account.');
        } finally {
            setIsWorking(false);
        }
    }

    async function handleProfileUpdate() {
        if (!selectedUser) return;

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
        if (!selectedUser) return;

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
        if (!selectedUser) return;
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
        if (!selectedUser) return;
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
        if (!selectedUser) return;

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
            setSelectedUser(null);
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

    function closeUserModal() {
        setSelectedUser(null);
        setSelectedUserId(null);
        setShowResetPasswordForm(false);
        setShowDeletePrompt(false);
        setShowMfaConfirm(false);
        setDeleteConfirmation('');
        setNewPassword('');
    }

    return (
        <div>
            <div className="admin-page-header au-header">
                <h1 className="admin-page-title">Manage Users</h1>
                <p className="admin-page-subtitle">
                    Create accounts, assign roles, maintain user identity details, and manage account security.
                </p>
            </div>

            {(errorMessage || successMessage) && (
                <AlertBanner
                    type={errorMessage ? 'warning' : 'success'}
                    message={errorMessage || successMessage}
                    onClose={() => {
                        setErrorMessage('');
                        setSuccessMessage('');
                    }}
                />
            )}

            <div className="au-summary">
                <SummaryChip icon={<UserCog size={20} />} value={metrics.totalUsers} label="Total Accounts" tone="default" />
                <SummaryChip icon={<ShieldCheck size={20} />} value={metrics.adminUsers} label="Admin Accounts" tone="admin" />
                <SummaryChip icon={<Lock size={20} />} value={metrics.mfaEnabled} label="MFA Enabled" tone="mfa" />
                <SummaryChip icon={<BadgeDollarSign size={20} />} value={formatCurrency(metrics.monetaryTotal)} label="Linked Monetary Total" tone="money" />
            </div>

            <div className="au-filters">
                <div className="au-filters-row">
                    <div className="au-filter-group">
                        <label className="au-filter-label" htmlFor="au-search">Search</label>
                        <div className="au-search-wrap">
                            <Search size={16} className="au-search-icon" />
                            <input
                                id="au-search"
                                className="au-filter-input"
                                placeholder="Search email or display name"
                                value={searchInput}
                                onChange={(event) => setSearchInput(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        setActiveSearch(searchInput.trim());
                                    }
                                }}
                            />
                        </div>
                    </div>

                    <div className="au-filter-group">
                        <label className="au-filter-label" htmlFor="au-sortby">Sort By</label>
                        <select
                            id="au-sortby"
                            className="au-filter-select"
                            value={sortBy}
                            onChange={(event) => setSortBy(event.target.value as SortBy)}
                        >
                            <option value="email">Email</option>
                            <option value="mfa">MFA</option>
                            <option value="donations">Donations</option>
                        </select>
                    </div>

                    <div className="au-filter-group">
                        <label className="au-filter-label" htmlFor="au-direction">Direction</label>
                        <select
                            id="au-direction"
                            className="au-filter-select"
                            value={sortDirection}
                            onChange={(event) => setSortDirection(event.target.value as SortDirection)}
                        >
                            <option value="asc">Ascending</option>
                            <option value="desc">Descending</option>
                        </select>
                    </div>
                </div>

                <div className="au-filter-actions">
                    <SecondaryButton onClick={() => setActiveSearch(searchInput.trim())}>Apply</SecondaryButton>
                    <SecondaryButton
                        onClick={() => {
                            setSearchInput('');
                            setActiveSearch('');
                        }}
                    >
                        Clear
                    </SecondaryButton>
                    <PrimaryButton onClick={() => setCreateOpen(true)}>
                        <UserPlus size={16} />
                        Create User
                    </PrimaryButton>
                </div>
            </div>

            <div className="au-table-wrap">
                <div className="au-table-scroll">
                    <table className="au-table">
                        <thead>
                            <tr>
                                <th>User</th>
                                <th>Role</th>
                                <th>MFA</th>
                                <th>Monetary Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {!isLoading && sortedUsers.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="au-empty">No users found.</td>
                                </tr>
                            )}

                            {sortedUsers.map((user) => {
                                const isActive = selectedUserId === user.id;
                                return (
                                    <tr key={user.id} className={isActive ? 'active' : ''} onClick={() => setSelectedUserId(user.id)}>
                                        <td>
                                            <div className="au-user-name">{user.preferredDisplayName}</div>
                                            <div className="au-user-email">{user.email ?? 'No email'}</div>
                                            {user.externalLoginProviders.some((provider) => provider.toLowerCase() === 'google') && (
                                                <span className="au-badge google">Google Sign-In</span>
                                            )}
                                        </td>
                                        <td>
                                            <span className={`au-badge ${user.roles.includes('Admin') ? 'admin' : 'donor'}`}>
                                                {user.roles.includes('Admin') ? 'Admin + Donor' : 'Donor'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`au-badge ${user.isTwoFactorEnabled ? 'mfa-on' : 'mfa-off'}`}>
                                                {user.isTwoFactorEnabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </td>
                                        <td className="au-money">{formatCurrency(user.totalMonetaryAmount)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="au-table-footer">
                    <span>Showing {sortedUsers.length} user{sortedUsers.length === 1 ? '' : 's'}</span>
                </div>
            </div>

            {createOpen && (
                <div className="au-modal-overlay" onClick={() => setCreateOpen(false)}>
                    <div className="au-modal" onClick={(event) => event.stopPropagation()}>
                        <div className="au-modal-header">
                            <h3>Create Account</h3>
                            <button type="button" className="au-close" onClick={() => setCreateOpen(false)} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="au-modal-body">
                            <div className="au-grid-2">
                                <label>
                                    Email *
                                    <input className="au-filter-input" type="email" value={createEmail} onChange={(event) => setCreateEmail(event.target.value)} />
                                </label>
                                <label>
                                    Password *
                                    <input className="au-filter-input" type="password" value={createPassword} onChange={(event) => setCreatePassword(event.target.value)} placeholder="Minimum 14 characters" />
                                </label>
                                <label>
                                    First Name
                                    <input className="au-filter-input" value={createFirstName} onChange={(event) => setCreateFirstName(event.target.value)} />
                                </label>
                                <label>
                                    Last Name
                                    <input className="au-filter-input" value={createLastName} onChange={(event) => setCreateLastName(event.target.value)} />
                                </label>
                                <label className="au-grid-full">
                                    Display Name
                                    <input className="au-filter-input" value={createDisplayName} onChange={(event) => setCreateDisplayName(event.target.value)} />
                                </label>
                                <label>
                                    Role Template
                                    <select className="au-filter-select" value={createRoleTemplate} onChange={(event) => setCreateRoleTemplate(event.target.value as RoleTemplate)}>
                                        <option value="donor">Donor</option>
                                        <option value="admin">Admin + Donor</option>
                                    </select>
                                </label>
                            </div>
                        </div>
                        <div className="au-modal-footer">
                            <SecondaryButton onClick={() => setCreateOpen(false)}>Cancel</SecondaryButton>
                            <PrimaryButton onClick={() => void handleCreateUser()} loading={isWorking} disabled={isWorking}>
                                Save New Account
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            )}

            {selectedUser && (
                <div className="au-modal-overlay" onClick={closeUserModal}>
                    <div className="au-modal large" onClick={(event) => event.stopPropagation()}>
                        <div className="au-modal-header">
                            <h3>{selectedUser.preferredDisplayName}</h3>
                            <button type="button" className="au-close" onClick={closeUserModal} aria-label="Close">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="au-modal-body">
                            <div className="au-user-meta">
                                <div>{selectedUser.email ?? 'No email'}</div>
                                <div className="au-meta-badges">
                                    {selectedUserHasGoogleLogin && <span className="au-badge google">Google Sign-In</span>}
                                    {selectedUserIsExternalOnly ? <span className="au-badge external">External-only account</span> : <span className="au-badge local">Local password account</span>}
                                </div>
                            </div>

                            <div className="au-section">
                                <h4>Role Assignment</h4>
                                <p>Admin implies Donor access automatically.</p>
                                <div className="au-inline-actions">
                                    <select
                                        className="au-filter-select"
                                        value={selectedRoleTemplate}
                                        onChange={(event) => setSelectedRoleTemplate(event.target.value as RoleTemplate)}
                                        disabled={selectedUser.email === authSession.email && selectedUser.roles.includes('Admin')}
                                    >
                                        <option value="donor">Donor</option>
                                        <option value="admin">Admin + Donor</option>
                                    </select>
                                    <SecondaryButton onClick={() => void handleRoleUpdate()} disabled={isWorking}>Save Role</SecondaryButton>
                                </div>
                            </div>

                            <div className="au-summary-mini">
                                <MiniPill label="MFA" value={selectedUser.isTwoFactorEnabled ? 'Enabled' : 'Disabled'} icon={<ShieldCheck size={14} />} />
                                <MiniPill label="Access Fails" value={selectedUser.accessFailedCount.toString()} icon={<Lock size={14} />} />
                                <MiniPill label="Donations" value={selectedUser.donationSummary.totalDonationCount.toString()} icon={<BadgeDollarSign size={14} />} />
                                <MiniPill label="Monetary" value={formatCurrency(selectedUser.donationSummary.totalMonetaryAmount)} icon={<BadgeDollarSign size={14} />} />
                            </div>

                            <div className="au-section">
                                <h4>Name &amp; Supporter Profile</h4>
                                <div className="au-grid-3">
                                    <label>
                                        First Name
                                        <input className="au-filter-input" value={profileFirstName} onChange={(event) => setProfileFirstName(event.target.value)} />
                                    </label>
                                    <label>
                                        Last Name
                                        <input className="au-filter-input" value={profileLastName} onChange={(event) => setProfileLastName(event.target.value)} />
                                    </label>
                                    <label>
                                        Display Name
                                        <input className="au-filter-input" value={profileDisplayName} onChange={(event) => setProfileDisplayName(event.target.value)} />
                                    </label>
                                </div>
                                <SecondaryButton onClick={() => void handleProfileUpdate()} disabled={isWorking}>Save Name Details</SecondaryButton>
                            </div>

                            <div className="au-section">
                                <h4>Recent Donations</h4>
                                {selectedUser.recentDonations.length === 0 ? (
                                    <div className="au-muted">No donation history linked to this supporter.</div>
                                ) : (
                                    <div className="au-table-scroll compact">
                                        <table className="au-table compact">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Type</th>
                                                    <th>Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedUser.recentDonations.map((donation) => (
                                                    <tr key={donation.donationId}>
                                                        <td>{donation.donationDate ?? '-'}</td>
                                                        <td>{donation.donationType ?? 'Unknown'}</td>
                                                        <td>{formatCurrency(donation.amount ?? 0)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div className="au-danger">
                                <div className="au-danger-title">
                                    <AlertTriangle size={16} />
                                    <span>Danger Zone</span>
                                </div>
                                <p>Sensitive actions are intentionally hidden behind explicit confirmation steps.</p>

                                {selectedUserIsExternalOnly && (
                                    <div className="au-warning">Password and MFA reset are disabled because this user authenticates via an external provider.</div>
                                )}

                                <div className="au-inline-actions wrap">
                                    <button
                                        type="button"
                                        className="au-danger-btn"
                                        onClick={() => setShowResetPasswordForm((prev) => !prev)}
                                        disabled={selectedUserIsExternalOnly}
                                    >
                                        {showResetPasswordForm ? 'Hide Password Reset' : 'Reveal Password Reset'}
                                    </button>
                                    <button
                                        type="button"
                                        className="au-danger-btn"
                                        onClick={() => setShowMfaConfirm((prev) => !prev)}
                                        disabled={selectedUserIsExternalOnly}
                                    >
                                        {showMfaConfirm ? 'Cancel MFA Reset' : 'Reveal MFA Reset'}
                                    </button>
                                    <button
                                        type="button"
                                        className="au-danger-btn"
                                        onClick={() => setShowDeletePrompt((prev) => !prev)}
                                    >
                                        {showDeletePrompt ? 'Cancel Delete' : 'Reveal Delete Account'}
                                    </button>
                                </div>

                                {showResetPasswordForm && !selectedUserIsExternalOnly && (
                                    <div className="au-danger-panel">
                                        <label>
                                            New Password
                                            <input className="au-filter-input" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Minimum 14 characters" />
                                        </label>
                                        <button type="button" className="au-danger-btn solid" onClick={() => void handlePasswordReset()} disabled={isWorking}>
                                            Confirm Password Reset
                                        </button>
                                    </div>
                                )}

                                {showMfaConfirm && !selectedUserIsExternalOnly && (
                                    <div className="au-danger-panel">
                                        <div className="au-muted">This will force the user to set up MFA again.</div>
                                        <button type="button" className="au-danger-btn solid" onClick={() => void handleMfaReset()} disabled={isWorking}>
                                            Confirm MFA Reset
                                        </button>
                                    </div>
                                )}

                                {showDeletePrompt && (
                                    <div className="au-danger-panel">
                                        <label>
                                            Type email to confirm delete
                                            <input className="au-filter-input" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder={selectedUser.email ?? ''} />
                                        </label>
                                        <button type="button" className="au-danger-btn solid" onClick={() => void handleDeleteUser()} disabled={isWorking}>
                                            Permanently Delete Account
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

type SummaryChipProps = {
    icon: ReactNode;
    value: string | number;
    label: string;
    tone: 'default' | 'admin' | 'mfa' | 'money';
};

function SummaryChip({ icon, value, label, tone }: SummaryChipProps) {
    return (
        <div className="au-chip">
            <div className={`au-chip-icon ${tone}`}>{icon}</div>
            <div>
                <div className="au-chip-value">{value}</div>
                <div className="au-chip-label">{label}</div>
            </div>
        </div>
    );
}

type MiniPillProps = {
    label: string;
    value: string;
    icon: ReactNode;
};

function MiniPill({ label, value, icon }: MiniPillProps) {
    return (
        <div className="au-mini-pill">
            <div className="au-mini-label">
                {icon}
                <span>{label}</span>
            </div>
            <div className="au-mini-value">{value}</div>
        </div>
    );
}
