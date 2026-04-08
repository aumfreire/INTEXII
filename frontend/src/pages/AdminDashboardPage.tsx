import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Users,
    AlertTriangle,
    DollarSign,
    Calendar,
    TrendingUp,
    TrendingDown,
    Minus,
    Gift,
    UserCheck,
    ArrowRight,
} from 'lucide-react';
import AlertBanner from '../components/ui/AlertBanner';
import { getAdminCaseload, getAdminSupporters } from '../lib/authAPI';
import '../styles/pages/admin-dashboard.css';

/* ===== Types ===== */
type RiskLevel = 'critical' | 'high' | 'moderate';
type EventType = 'conference' | 'visit' | 'followup';
type ActivityType = 'monetary' | 'inkind' | 'volunteer';
type CaseStatus = 'active' | 'intake' | 'reintegration' | 'closed';

interface AttentionItem {
    id: string;
    name: string;
    reason: string;
    risk: RiskLevel;
}

interface UpcomingItem {
    id: string;
    title: string;
    meta: string;
    date: string;
    type: EventType;
}

interface ActivityItem {
    id: string;
    text: string;
    donor: string;
    time: string;
    amount: string;
    activityType: ActivityType;
}

interface SafehouseData {
    name: string;
    residents: number;
    capacity: number;
    highRisk: number;
}

/* ===== Mock Data ===== */
const mockAttentionItems: AttentionItem[] = [
    { id: '1', name: 'Joy A.', reason: 'New intake — initial risk assessment overdue', risk: 'critical' },
    { id: '2', name: 'Grace M.', reason: 'Missed counseling session (2nd consecutive)', risk: 'high' },
    { id: '3', name: 'Mercy T.', reason: 'Emotional distress flagged by house mother', risk: 'high' },
    { id: '4', name: 'Faith K.', reason: 'Reintegration home visit report pending', risk: 'moderate' },
];

const mockUpcomingItems: UpcomingItem[] = [
    { id: '1', title: 'Case Conference: Grace M.', meta: 'Multi-disciplinary review — Maria, Sarah, Dr. Adewale', date: '2026-04-09', type: 'conference' },
    { id: '2', title: 'Home Visit: Hope N.', meta: 'Pre-reintegration family assessment', date: '2026-04-10', type: 'visit' },
    { id: '3', title: 'Follow-up: Mercy T.', meta: 'Post-counseling check-in with house mother', date: '2026-04-10', type: 'followup' },
    { id: '4', title: 'Case Conference: Blessing O.', meta: 'Quarterly progress review', date: '2026-04-11', type: 'conference' },
    { id: '5', title: 'Home Visit: Faith K.', meta: 'Family readiness evaluation — 2nd visit', date: '2026-04-12', type: 'visit' },
];

const mockActivityItems: ActivityItem[] = [
    { id: '1', text: 'Monthly recurring gift', donor: 'James & Ruth Okafor', time: '2 hours ago', amount: '$500', activityType: 'monetary' },
    { id: '2', text: 'Food supplies delivered', donor: 'Green Earth Foods', time: '6 hours ago', amount: '$650', activityType: 'inkind' },
    { id: '3', text: 'Tutoring sessions (12 hrs)', donor: 'Sarah Chen', time: 'Yesterday', amount: '$360', activityType: 'volunteer' },
    { id: '4', text: 'Q1 partnership grant', donor: 'Voices for Children NGO', time: '2 days ago', amount: '$5,000', activityType: 'monetary' },
];

const mockSafehouses: SafehouseData[] = [
    { name: 'Haven House A', residents: 4, capacity: 6, highRisk: 2 },
    { name: 'Haven House B', residents: 2, capacity: 5, highRisk: 0 },
    { name: 'Haven House C', residents: 2, capacity: 5, highRisk: 1 },
];

/* Status distribution */
const statusDistribution = [
    { label: 'Active', count: 5, dot: 'active' },
    { label: 'Intake', count: 1, dot: 'intake' },
    { label: 'Reintegration', count: 1, dot: 'reintegration' },
    { label: 'Closed', count: 1, dot: 'closed' },
];

/* Safehouse occupancy for bar chart */
const occupancyData = [
    { label: 'House A', value: 4, max: 6, color: 'primary' },
    { label: 'House B', value: 2, max: 5, color: 'sage' },
    { label: 'House C', value: 2, max: 5, color: 'light' },
];

const riskLabels: Record<RiskLevel, string> = {
    critical: 'Critical',
    high: 'High',
    moderate: 'Moderate',
};

const typeLabels: Record<EventType, string> = {
    conference: 'Conference',
    visit: 'Home Visit',
    followup: 'Follow-up',
};

function formatEventDate(iso: string): { day: string; month: string } {
    const d = new Date(iso + 'T00:00:00');
    return {
        day: d.getDate().toString(),
        month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    };
}

/* ===== Main Page ===== */
export default function AdminDashboardPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);
    const [activeResidents, setActiveResidents] = useState(0);
    const [highRiskCount, setHighRiskCount] = useState(0);
    const [donationsThisMonth, setDonationsThisMonth] = useState(0);
    const [attentionItems, setAttentionItems] = useState<AttentionItem[]>(mockAttentionItems);
    const [activityItems, setActivityItems] = useState<ActivityItem[]>(mockActivityItems);
    const [statusDistributionData, setStatusDistributionData] = useState(statusDistribution);
    const [occupancyDataRows, setOccupancyDataRows] = useState(occupancyData);
    const [safehouseRows, setSafehouseRows] = useState<SafehouseData[]>(mockSafehouses);

    useEffect(() => {
        let isMounted = true;

        async function loadDashboardData() {
            setIsLoading(true);
            setHasError(false);

            try {
                const [caseload, supporters] = await Promise.all([
                    getAdminCaseload(),
                    getAdminSupporters(),
                ]);

                if (!isMounted) return;

                setActiveResidents(caseload.length);
                setHighRiskCount(caseload.filter((item) => item.riskLevel === 'high' || item.riskLevel === 'critical').length);

                const monthlyTotal = supporters
                    .reduce((sum, item) => sum + item.lifetimeValue, 0) / 12;
                setDonationsThisMonth(monthlyTotal);

                const mappedAttention = caseload
                    .filter((item) => item.riskLevel === 'high' || item.riskLevel === 'critical')
                    .slice(0, 4)
                    .map((item) => ({
                        id: String(item.id),
                        name: item.name,
                        reason: `${item.caseCategory} case under ${item.assignedWorker ?? 'unassigned worker'}`,
                        risk: item.riskLevel === 'critical' ? 'critical' : 'high',
                    } as AttentionItem));
                if (mappedAttention.length > 0) {
                    setAttentionItems(mappedAttention);
                }

                const mappedActivity = supporters
                    .slice(0, 4)
                    .map((item, index) => ({
                        id: String(item.id),
                        text: 'Supporter contribution summary',
                        donor: item.name,
                        time: item.lastContribution ? formatEventDate(item.lastContribution).month : `#${index + 1}`,
                        amount: `$${Math.round(item.lifetimeValue).toLocaleString()}`,
                        activityType: item.type === 'inkind' ? 'inkind' : item.type === 'volunteer' ? 'volunteer' : 'monetary',
                    } as ActivityItem));
                if (mappedActivity.length > 0) {
                    setActivityItems(mappedActivity);
                }

                const statuses: CaseStatus[] = ['active', 'intake', 'reintegration', 'closed'];
                setStatusDistributionData(
                    statuses.map((status) => ({
                        label: status.charAt(0).toUpperCase() + status.slice(1),
                        count: caseload.filter((item) => item.caseStatus === status).length,
                        dot: status,
                    }))
                );

                const groupedSafehouses = caseload.reduce<Record<string, SafehouseData>>((acc, item) => {
                    const key = item.safehouse || 'Unassigned';
                    if (!acc[key]) {
                        acc[key] = { name: key, residents: 0, capacity: 6, highRisk: 0 };
                    }

                    acc[key].residents += 1;
                    if (item.riskLevel === 'high' || item.riskLevel === 'critical') {
                        acc[key].highRisk += 1;
                    }

                    return acc;
                }, {});

                const safehouses = Object.values(groupedSafehouses);
                if (safehouses.length > 0) {
                    setSafehouseRows(safehouses);
                    setOccupancyDataRows(
                        safehouses.map((house, index) => ({
                            label: house.name,
                            value: house.residents,
                            max: house.capacity,
                            color: index % 3 === 0 ? 'primary' : index % 3 === 1 ? 'sage' : 'light',
                        }))
                    );
                }
            } catch {
                if (!isMounted) return;
                setHasError(true);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        void loadDashboardData();

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <div>
            {/* Welcome Header */}
            <div className="dash-header">
                <h1 className="dash-welcome">Good morning, Maria</h1>
                <p className="dash-welcome-sub">
                    Here's what needs your attention today — April 8, 2026
                </p>
            </div>

            {/* Error State */}
            {hasError && (
                <AlertBanner
                    type="warning"
                    message="Unable to load dashboard data. Please try again."
                    onClose={() => setHasError(false)}
                />
            )}

            {/* Loading State */}
            {isLoading ? (
                <>
                    {/* Skeleton KPIs */}
                    <div className="dash-kpis">
                        {[1, 2, 3, 4].map((i) => (
                            <div className="dash-kpi" key={i}>
                                <div className="dash-skeleton-kpi" style={{ width: '100%', padding: 0 }}>
                                    <div className="dash-skeleton-bar" style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)' }} />
                                    <div style={{ flex: 1 }}>
                                        <div className="dash-skeleton-bar" style={{ width: '48px', height: '22px', marginBottom: '6px' }} />
                                        <div className="dash-skeleton-bar" style={{ width: '90px', height: '12px' }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Skeleton Panels */}
                    <div className="dash-panels">
                        {[1, 2].map((i) => (
                            <div className="dash-panel" key={i}>
                                <div className="dash-panel-header">
                                    <div className="dash-skeleton-bar" style={{ width: '140px', height: '16px' }} />
                                </div>
                                <div className="dash-panel-body">
                                    {[1, 2, 3].map((j) => (
                                        <div className="dash-skeleton-row" key={j}>
                                            <div className="dash-skeleton-bar" style={{ width: '8px', height: '8px', borderRadius: '50%' }} />
                                            <div style={{ flex: 1 }}>
                                                <div className="dash-skeleton-bar" style={{ width: '70%', height: '14px', marginBottom: '6px' }} />
                                                <div className="dash-skeleton-bar" style={{ width: '50%', height: '11px' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="dash-kpis">
                        <div className="dash-kpi">
                            <div className="dash-kpi-icon residents">
                                <Users size={20} />
                            </div>
                            <div>
                                <div className="dash-kpi-value">{activeResidents}</div>
                                <div className="dash-kpi-label">Active Residents</div>
                                <div className="dash-kpi-trend up">
                                    <TrendingUp size={12} /> +1 this month
                                </div>
                            </div>
                        </div>
                        <div className="dash-kpi">
                            <div className="dash-kpi-icon risk">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <div className="dash-kpi-value">{highRiskCount}</div>
                                <div className="dash-kpi-label">High / Critical Risk</div>
                                <div className="dash-kpi-trend down">
                                    <TrendingDown size={12} /> Needs review
                                </div>
                            </div>
                        </div>
                        <div className="dash-kpi">
                            <div className="dash-kpi-icon donations">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <div className="dash-kpi-value">${Math.round(donationsThisMonth).toLocaleString()}</div>
                                <div className="dash-kpi-label">Donations This Month</div>
                                <div className="dash-kpi-trend up">
                                    <TrendingUp size={12} /> +12% vs last month
                                </div>
                            </div>
                        </div>
                        <div className="dash-kpi">
                            <div className="dash-kpi-icon conferences">
                                <Calendar size={20} />
                            </div>
                            <div>
                                <div className="dash-kpi-value">5</div>
                                <div className="dash-kpi-label">Upcoming This Week</div>
                                <div className="dash-kpi-trend neutral">
                                    <Minus size={12} /> 2 conferences, 2 visits
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Panels — Needs Attention + Upcoming */}
                    <div className="dash-panels">
                        {/* Needs Attention */}
                        <div className="dash-panel">
                            <div className="dash-panel-header">
                                <h3 className="dash-panel-title">
                                    Needs Attention
                                    <span className="dash-panel-count attention">{attentionItems.length}</span>
                                </h3>
                                <Link to="/admin/caseload" className="dash-panel-link">
                                    View Caseload <ArrowRight size={13} style={{ marginLeft: '2px' }} />
                                </Link>
                            </div>
                            <div className="dash-panel-body">
                                {attentionItems.map((item) => (
                                    <Link
                                        to={`/admin/residents/${item.id}`}
                                        key={item.id}
                                        className="dash-attention-item"
                                        style={{ textDecoration: 'none', color: 'inherit' }}
                                    >
                                        <span className={`dash-attention-dot ${item.risk}`} />
                                        <div className="dash-attention-info">
                                            <div className="dash-attention-name">{item.name}</div>
                                            <div className="dash-attention-reason">{item.reason}</div>
                                        </div>
                                        <span className={`dash-attention-badge ${item.risk}`}>
                                            {riskLabels[item.risk]}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* Upcoming This Week */}
                        <div className="dash-panel">
                            <div className="dash-panel-header">
                                <h3 className="dash-panel-title">
                                    Upcoming This Week
                                    <span className="dash-panel-count upcoming">{mockUpcomingItems.length}</span>
                                </h3>
                                <Link to="/admin/case-conferences" className="dash-panel-link">
                                    View All <ArrowRight size={13} style={{ marginLeft: '2px' }} />
                                </Link>
                            </div>
                            <div className="dash-panel-body">
                                {mockUpcomingItems.map((item) => {
                                    const d = formatEventDate(item.date);
                                    return (
                                        <div className="dash-upcoming-item" key={item.id}>
                                            <div className="dash-upcoming-date-box">
                                                <span className="dash-upcoming-day">{d.day}</span>
                                                <span className="dash-upcoming-month">{d.month}</span>
                                            </div>
                                            <div className="dash-upcoming-info">
                                                <div className="dash-upcoming-title">{item.title}</div>
                                                <div className="dash-upcoming-meta">{item.meta}</div>
                                            </div>
                                            <span className={`dash-upcoming-type ${item.type}`}>
                                                {typeLabels[item.type]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Recent Support Activity — Full Width */}
                    <div className="dash-panels">
                        <div className="dash-panel full-width">
                            <div className="dash-panel-header">
                                <h3 className="dash-panel-title">
                                    Recent Support Activity
                                    <span className="dash-panel-count activity">{activityItems.length}</span>
                                </h3>
                                <Link to="/admin/donors" className="dash-panel-link">
                                    View Supporters <ArrowRight size={13} style={{ marginLeft: '2px' }} />
                                </Link>
                            </div>
                            <div className="dash-panel-body">
                                {activityItems.map((item) => {
                                    const IconComp = item.activityType === 'monetary' ? DollarSign
                                        : item.activityType === 'inkind' ? Gift
                                            : UserCheck;
                                    return (
                                        <div className="dash-activity-item" key={item.id}>
                                            <div className={`dash-activity-icon ${item.activityType}`}>
                                                <IconComp size={16} />
                                            </div>
                                            <div className="dash-activity-info">
                                                <div className="dash-activity-text">
                                                    <strong>{item.donor}</strong> — {item.text}
                                                </div>
                                                <div className="dash-activity-time">{item.time}</div>
                                            </div>
                                            <span className="dash-activity-amount">{item.amount}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Program Snapshot */}
                    <div className="dash-snapshot">
                        {/* Occupancy by Safehouse */}
                        <div className="dash-snapshot-card">
                            <h4 className="dash-snapshot-title">Safehouse Occupancy</h4>
                            {occupancyDataRows.map((row) => (
                                <div className="dash-bar-row" key={row.label}>
                                    <span className="dash-bar-label">{row.label}</span>
                                    <div className="dash-bar-track">
                                        <div
                                            className={`dash-bar-fill ${row.color}`}
                                            style={{ width: `${(row.value / row.max) * 100}%` }}
                                        />
                                    </div>
                                    <span className="dash-bar-value">{row.value}/{row.max}</span>
                                </div>
                            ))}
                        </div>

                        {/* Case Status Distribution */}
                        <div className="dash-snapshot-card">
                            <h4 className="dash-snapshot-title">Case Status Distribution</h4>
                            {statusDistributionData.map((row) => (
                                <div className="dash-status-row" key={row.label}>
                                    <span className="dash-status-label">
                                        <span className={`dash-status-dot ${row.dot}`} />
                                        {row.label}
                                    </span>
                                    <span className="dash-status-value">{row.count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Safehouse Comparison Mini Cards */}
                    <div className="dash-safehouses">
                        {safehouseRows.map((house) => (
                            <div className="dash-safehouse" key={house.name}>
                                <h4 className="dash-safehouse-name">{house.name}</h4>
                                <div className="dash-safehouse-stats">
                                    <div className="dash-safehouse-stat">
                                        <div className="dash-safehouse-stat-value">{house.residents}</div>
                                        <div className="dash-safehouse-stat-label">Residents</div>
                                    </div>
                                    <div className="dash-safehouse-stat">
                                        <div className="dash-safehouse-stat-value">{house.capacity}</div>
                                        <div className="dash-safehouse-stat-label">Capacity</div>
                                    </div>
                                    <div className="dash-safehouse-stat">
                                        <div className="dash-safehouse-stat-value">{house.highRisk}</div>
                                        <div className="dash-safehouse-stat-label">High Risk</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
