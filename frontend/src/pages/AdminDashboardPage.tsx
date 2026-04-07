import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AlertBanner from '../components/ui/AlertBanner';
import { getAdminSummary } from '../lib/authAPI';
import type { AdminUserSummaryMetrics } from '../types/AdminUser';

export default function AdminDashboardPage() {
    const [summary, setSummary] = useState<AdminUserSummaryMetrics | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    const loadSummary = useCallback(async () => {
        setErrorMessage('');

        try {
            const response = await getAdminSummary();
            setSummary(response);
        } catch (error) {
            setErrorMessage(
                error instanceof Error
                    ? error.message
                    : 'Unable to load admin metrics.'
            );
        }
    }, []);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void loadSummary();
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, [loadSummary]);

    return (
        <div className="container" style={{ padding: '48px 24px' }}>
            <div className="login-card" style={{ maxWidth: '900px' }}>
                <h2>Admin Dashboard</h2>
                <p className="login-subtitle">
                    Manage users and monitor account-level security activity.
                </p>

                {errorMessage ? (
                    <AlertBanner
                        message={errorMessage}
                        type="warning"
                        onClose={() => setErrorMessage('')}
                    />
                ) : null}

                <div className="row g-3" style={{ marginBottom: '20px' }}>
                    <div className="col-12 col-md-6 col-lg-3">
                        <div className="border rounded p-3 h-100 bg-white">
                            <div className="text-muted">Total Users</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                                {summary?.totalUsers ?? '-'}
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                        <div className="border rounded p-3 h-100 bg-white">
                            <div className="text-muted">Admins</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                                {summary?.admins ?? '-'}
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                        <div className="border rounded p-3 h-100 bg-white">
                            <div className="text-muted">Donors</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                                {summary?.donors ?? '-'}
                            </div>
                        </div>
                    </div>
                    <div className="col-12 col-md-6 col-lg-3">
                        <div className="border rounded p-3 h-100 bg-white">
                            <div className="text-muted">MFA Enabled</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                                {summary?.usersWithMfa ?? '-'}
                            </div>
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Link to="/admin/users" className="btn btn-primary">
                        Manage Users
                    </Link>
                    <Link to="/dashboard" className="btn btn-outline-secondary">
                        Back to My Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
