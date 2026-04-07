import { type CSSProperties, type ReactNode, useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, DollarSign, Landmark, ShieldCheck, UserCheck, Users } from 'lucide-react';
import AlertBanner from '../components/ui/AlertBanner';
import { getAdminDonationSummary, getAdminSummary } from '../lib/authAPI';
import { formatCurrency } from '../lib/formatters';
import type { AdminDonationSummary, AdminUserSummaryMetrics } from '../types/AdminUser';

const metricNumberStyle: CSSProperties = {
    fontSize: '1.85rem',
    fontWeight: 700,
    lineHeight: 1.1,
};

export default function AdminDashboardPage() {
    const [summary, setSummary] = useState<AdminUserSummaryMetrics | null>(null);
    const [donationSummary, setDonationSummary] = useState<AdminDonationSummary | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    const loadMetrics = useCallback(async () => {
        setErrorMessage('');

        try {
            const [userSummaryResponse, donationSummaryResponse] = await Promise.all([
                getAdminSummary(),
                getAdminDonationSummary(),
            ]);

            setSummary(userSummaryResponse);
            setDonationSummary(donationSummaryResponse);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Unable to load admin metrics.'
            );
        }
    }, []);

    useEffect(() => {
        void loadMetrics();
    }, [loadMetrics]);

    return (
        <div className="container py-5">
            <div className="login-card" style={{ maxWidth: '1150px' }}>
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
                    <div>
                        <h2 className="mb-2">Administration Console</h2>
                        <p className="login-subtitle mb-0">
                            Monitor account security and donation performance in one place.
                        </p>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                        <Link to="/admin/users" className="btn btn-primary">
                            Manage Users
                        </Link>
                        <Link to="/dashboard" className="btn btn-outline-secondary">
                            Back to My Dashboard
                        </Link>
                    </div>
                </div>

                {errorMessage ? (
                    <AlertBanner
                        message={errorMessage}
                        type="warning"
                        onClose={() => setErrorMessage('')}
                    />
                ) : null}

                <h5 className="mb-3">Identity & Security</h5>
                <div className="row g-3 mb-4">
                    <MetricCard
                        icon={<Users size={18} />}
                        label="Total Users"
                        value={summary?.totalUsers.toString() ?? '-'}
                    />
                    <MetricCard
                        icon={<ShieldCheck size={18} />}
                        label="Admins"
                        value={summary?.admins.toString() ?? '-'}
                    />
                    <MetricCard
                        icon={<UserCheck size={18} />}
                        label="Donors"
                        value={summary?.donors.toString() ?? '-'}
                    />
                    <MetricCard
                        icon={<Activity size={18} />}
                        label="MFA Enabled"
                        value={summary?.usersWithMfa.toString() ?? '-'}
                    />
                </div>

                <h5 className="mb-3">Donations</h5>
                <div className="row g-3">
                    <MetricCard
                        icon={<DollarSign size={18} />}
                        label="Monetary Total"
                        value={
                            donationSummary
                                ? formatCurrency(donationSummary.totalMonetaryAmount)
                                : '-'
                        }
                    />
                    <MetricCard
                        icon={<Landmark size={18} />}
                        label="Estimated Value"
                        value={
                            donationSummary
                                ? formatCurrency(donationSummary.totalEstimatedValue)
                                : '-'
                        }
                    />
                    <MetricCard
                        icon={<Users size={18} />}
                        label="Donation Count"
                        value={donationSummary?.totalDonationCount.toString() ?? '-'}
                    />
                    <MetricCard
                        icon={<Activity size={18} />}
                        label="Latest Donation"
                        value={donationSummary?.latestDonationDate ?? '-'}
                    />
                </div>
            </div>
        </div>
    );
}

type MetricCardProps = {
    icon: ReactNode;
    label: string;
    value: string;
};

function MetricCard({ icon, label, value }: MetricCardProps) {
    return (
        <div className="col-12 col-sm-6 col-lg-3">
            <div className="border rounded-3 p-3 h-100 bg-white shadow-sm">
                <div className="d-flex align-items-center gap-2 text-muted mb-2" style={{ fontWeight: 600 }}>
                    <span>{icon}</span>
                    <span>{label}</span>
                </div>
                <div style={metricNumberStyle}>{value}</div>
            </div>
        </div>
    );
}
