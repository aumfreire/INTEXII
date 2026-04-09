import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, CalendarDays, Gift, ShieldCheck, UserRoundPen, ReceiptText } from 'lucide-react';
import AlertBanner from '../components/ui/AlertBanner';
import { getMyDonations } from '../lib/authAPI';
import { formatCurrency } from '../lib/formatters';
import { useAuth } from '../context/useAuth';
import '../styles/pages/admin-dashboard.css';
import '../styles/pages/donor-dashboard.css';

function getYear(value: string | null): number | null {
    if (!value) return null;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed.getFullYear();
}

export default function DashboardPage() {
    const { authSession } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [lifetimeTotal, setLifetimeTotal] = useState(0);
    const [currentYearTotal, setCurrentYearTotal] = useState(0);
    const [giftCount, setGiftCount] = useState(0);

    const greetingName =
        authSession.displayName
        ?? authSession.userName
        ?? authSession.email?.split('@')[0]
        ?? 'there';

    useEffect(() => {
        let isMounted = true;

        async function loadDashboardStats() {
            setIsLoading(true);
            setErrorMessage('');

            try {
                const response = await getMyDonations({
                    page: 1,
                    pageSize: 1000,
                });

                if (!isMounted) return;

                const currentYear = new Date().getFullYear();
                const donations = response.items;

                const lifetime = donations.reduce((sum, donation) => sum + (donation.amount ?? 0), 0);
                const thisYear = donations.reduce((sum, donation) => {
                    const year = getYear(donation.donationDate);
                    if (year === currentYear) {
                        return sum + (donation.amount ?? 0);
                    }
                    return sum;
                }, 0);

                setLifetimeTotal(lifetime);
                setCurrentYearTotal(thisYear);
                setGiftCount(response.totalCount);
            } catch (error) {
                if (!isMounted) return;
                setErrorMessage(error instanceof Error ? error.message : 'Unable to load your dashboard metrics.');
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadDashboardStats();

        return () => {
            isMounted = false;
        };
    }, []);

    const currentYearLabel = useMemo(() => new Date().getFullYear(), []);

    return (
        <div className="container donor-dashboard-shell" style={{ padding: '40px 24px' }}>
            <div className="dash-header">
                <h1 className="dash-welcome">Hello, {greetingName}</h1>
                <p className="dash-welcome-sub">
                    Here is your giving overview and account activity for {currentYearLabel}.
                </p>
                <p className="donor-dashboard-account">
                    Signed in as <strong>{authSession.email ?? 'unknown user'}</strong>
                </p>
            </div>

            {errorMessage ? (
                <AlertBanner
                    type="warning"
                    message={errorMessage}
                    onClose={() => setErrorMessage('')}
                />
            ) : null}

            <section className="dash-kpis donor-kpis" aria-label="Donor statistics">
                <div className="dash-kpi">
                    <div className="dash-kpi-icon donations">
                        <CalendarDays size={18} />
                    </div>
                    <div>
                        <div className="dash-kpi-value">{isLoading ? '—' : formatCurrency(currentYearTotal)}</div>
                        <div className="dash-kpi-label">Donated This Year</div>
                    </div>
                </div>

                <div className="dash-kpi">
                    <div className="dash-kpi-icon risk">
                        <DollarSign size={18} />
                    </div>
                    <div>
                        <div className="dash-kpi-value">{isLoading ? '—' : formatCurrency(lifetimeTotal)}</div>
                        <div className="dash-kpi-label">Lifetime Donations</div>
                    </div>
                </div>

                <div className="dash-kpi">
                    <div className="dash-kpi-icon conferences">
                        <Gift size={18} />
                    </div>
                    <div>
                        <div className="dash-kpi-value">{isLoading ? '—' : giftCount.toLocaleString()}</div>
                        <div className="dash-kpi-label">Total Gifts</div>
                    </div>
                </div>
            </section>

            <section className="dash-panel full-width donor-actions-panel" aria-label="Donor actions">
                <div className="dash-panel-header">
                    <h2 className="dash-panel-title">
                        <ReceiptText size={16} />
                        Manage Your Account
                    </h2>
                </div>
                <div className="dash-panel-body donor-actions-grid">
                    <Link to="/profile" className="donor-action-link">
                        <span className="donor-action-icon">
                            <UserRoundPen size={18} />
                        </span>
                        <span>
                            <strong>Edit My Profile</strong>
                            <small>Update your personal and account details.</small>
                        </span>
                    </Link>

                    <Link to="/mfa" className="donor-action-link">
                        <span className="donor-action-icon">
                            <ShieldCheck size={18} />
                        </span>
                        <span>
                            <strong>Manage MFA</strong>
                            <small>Review two-factor settings and recovery options.</small>
                        </span>
                    </Link>

                    <Link to="/donations" className="donor-action-link">
                        <span className="donor-action-icon">
                            <ReceiptText size={18} />
                        </span>
                        <span>
                            <strong>My Donations</strong>
                            <small>View history, search records, and repeat gifts.</small>
                        </span>
                    </Link>
                </div>
            </section>
        </div>
    );
}
