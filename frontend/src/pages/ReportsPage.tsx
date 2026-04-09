import { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, Home, ArrowRightLeft, Loader2, AlertTriangle } from 'lucide-react';
import {
  getReportsDonationTrends,
  getReportsResidentOutcomes,
  getReportsSafehouseMetrics,
  getReportsReintegrationRates,
  getReportsSummary,
  type DonationTrendItem,
  type ResidentOutcomeStats,
  type SafehouseMetric,
  type ReintegrationStats,
  type ReportSummary,
} from '../lib/authAPI';
import '../styles/pages/reports.css';

const PRIMARY = '#C1603A';
const SAGE = '#7A9E7E';
const ORANGE = '#e67e22';
const MUTED_BLUE = '#5b7fa6';
const CAPACITY_BAR = '#6b655c';

const STATUS_COLORS: Record<string, string> = {
  active: SAGE,
  intake: MUTED_BLUE,
  reintegration: ORANGE,
  closed: '#9e9e9e',
};

const CATEGORY_COLORS = [PRIMARY, SAGE, ORANGE, MUTED_BLUE, '#8e44ad', '#16a085', '#c0392b', '#2980b9'];

function formatCurrency(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
  return (
    <div className="rp-kpi-card">
      <div className="rp-kpi-icon" style={{ backgroundColor: `${color}18`, color }}>
        <Icon size={22} />
      </div>
      <div>
        <div className="rp-kpi-value">{value}</div>
        <div className="rp-kpi-label">{label}</div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [donationTrends, setDonationTrends] = useState<DonationTrendItem[]>([]);
  const [outcomes, setOutcomes] = useState<ResidentOutcomeStats | null>(null);
  const [safehouses, setSafehouses] = useState<SafehouseMetric[]>([]);
  const [reintegration, setReintegration] = useState<ReintegrationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const [s, dt, o, sh, ri] = await Promise.all([
          getReportsSummary(),
          getReportsDonationTrends(),
          getReportsResidentOutcomes(),
          getReportsSafehouseMetrics(),
          getReportsReintegrationRates(),
        ]);
        setSummary(s);
        setDonationTrends(dt);
        setOutcomes(o);
        setSafehouses(sh);
        setReintegration(ri);
      } catch {
        setError('Failed to load report data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="rp-loading">
        <Loader2 size={32} className="spin-icon" style={{ color: 'var(--color-primary-light)' }} />
        <span>Loading reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rp-error">
        <AlertTriangle size={32} style={{ color: 'var(--color-primary)' }} />
        <p>{error}</p>
      </div>
    );
  }

  /* Build chart data from API responses */
  const statusChartData = outcomes
    ? outcomes.statusCounts.map((item) => ({ name: item.status, value: item.count }))
    : [];

  const categoryChartData = outcomes
    ? [...outcomes.categoryCounts]
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((item) => ({ name: item.category, value: item.count }))
    : [];

  const safehouseChartData = safehouses.map((s) => ({
    name: s.name,
    residents: s.residentCount,
    capacity: s.capacity,
    highRisk: s.highRiskCount,
  }));

  const reintChartData = reintegration
    ? [
      { name: 'Reintegrated', value: reintegration.reintegrated, color: SAGE },
      { name: 'In Progress', value: reintegration.inProgress, color: ORANGE },
      { name: 'Ready', value: reintegration.ready, color: MUTED_BLUE },
      { name: 'Not Started', value: reintegration.notStarted, color: '#ccc' },
    ]
    : [];

  const trendData = donationTrends.map((d) => ({
    ...d,
    totalFormatted: d.total,
  }));

  function formatCurrencyTooltip(value: unknown): [string, string] {
    const numeric = typeof value === 'number' ? value : Number(value ?? 0);
    return [formatCurrency(Number.isFinite(numeric) ? numeric : 0), 'Total'];
  }

  function formatSafehouseTooltip(value: unknown, name?: unknown): [string | number, string] {
    const seriesName = String(name ?? '');
    const seriesLabel =
      seriesName === 'capacity' ? 'Capacity'
        : seriesName === 'residents' ? 'Residents'
          : seriesName === 'highRisk' ? 'High Risk'
            : seriesName;
    return [typeof value === 'number' ? value : Number(value ?? 0), seriesLabel];
  }

  return (
    <div className="rp-page">
      {/* Page header */}
      <div className="rp-page-header">
        <div>
          <h2 className="rp-page-title">Reports &amp; Analytics</h2>
          <p className="rp-page-subtitle">Program performance, resident outcomes, and financial overview</p>
        </div>
      </div>

      {/* KPI summary row */}
      {summary && (
        <div className="rp-kpi-row">
          <KpiCard icon={Users} label="Active Residents" value={summary.activeResidents} color={PRIMARY} />
          <KpiCard icon={Users} label="Intakes (12 mo)" value={summary.intakeCount} color={MUTED_BLUE} />
          <KpiCard icon={AlertTriangle} label="High Risk" value={summary.highRiskCount} color={ORANGE} />
          <KpiCard icon={Home} label="Active Safehouses" value={summary.activeSafehouses} color={SAGE} />
          <KpiCard icon={TrendingUp} label="Donations (30d)" value={formatCurrency(summary.recentDonationsLast30Days)} color={PRIMARY} />
          <KpiCard icon={Users} label="Total Donors" value={summary.totalDonors} color={SAGE} />
        </div>
      )}

      {/* Section 1: Donation Trends */}
      <div className="rp-section">
        <div className="rp-section-header">
          <TrendingUp size={18} style={{ color: PRIMARY }} />
          <h3 className="rp-section-title">Donation Trends — Last 12 Months</h3>
        </div>
        <div className="rp-chart-card">
          {trendData.length === 0 ? (
            <div className="rp-empty">No donation data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trendData} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v: number) => formatCurrency(v)} tick={{ fontSize: 12 }} />
                <Tooltip formatter={formatCurrencyTooltip} />
                <Legend />
                <Line type="monotone" dataKey="total" name="Donations" stroke={PRIMARY} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Section 2: Resident Outcomes — two charts side by side */}
      <div className="rp-section">
        <div className="rp-section-header">
          <Users size={18} style={{ color: MUTED_BLUE }} />
          <h3 className="rp-section-title">Resident Outcomes</h3>
        </div>
        <div className="rp-two-col">
          {/* Case Status bar */}
          <div className="rp-chart-card">
            <h4 className="rp-chart-subtitle">Case Status Distribution</h4>
            {statusChartData.length === 0 ? (
              <div className="rp-empty">No data.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusChartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" name="Residents" radius={[4, 4, 0, 0]}>
                    {statusChartData.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name.toLowerCase()] ?? PRIMARY} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Case Categories pie */}
          <div className="rp-chart-card">
            <h4 className="rp-chart-subtitle">Case Categories</h4>
            {categoryChartData.length === 0 ? (
              <div className="rp-empty">No data.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={3}
                  >
                    {categoryChartData.map((_, i) => (
                      <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.78rem' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Safehouse Metrics */}
      <div className="rp-section">
        <div className="rp-section-header">
          <Home size={18} style={{ color: SAGE }} />
          <h3 className="rp-section-title">Safehouse Performance</h3>
        </div>
        <div className="rp-chart-card">
          {safehouseChartData.length === 0 ? (
            <div className="rp-empty">No safehouse data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, safehouseChartData.length * 52)}>
              <BarChart
                layout="vertical"
                data={safehouseChartData}
                margin={{ top: 8, right: 24, left: 8, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ede8" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={220} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={formatSafehouseTooltip}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #cfc7bc',
                    borderRadius: '8px',
                    color: '#1f1b16',
                    boxShadow: '0 8px 18px rgba(0, 0, 0, 0.16)',
                  }}
                  labelStyle={{ color: '#1f1b16', fontWeight: 700 }}
                  itemStyle={{ color: '#1f1b16', fontWeight: 600 }}
                />
                <Legend />
                <Bar dataKey="capacity" name="Capacity" fill={CAPACITY_BAR} radius={[0, 4, 4, 0]} />
                <Bar dataKey="residents" name="Residents" fill={SAGE} radius={[0, 4, 4, 0]} />
                <Bar dataKey="highRisk" name="High Risk" fill={ORANGE} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Safehouse table */}
        {safehouses.length > 0 && (
          <div className="rp-table-card" style={{ marginTop: '16px' }}>
            <table className="rp-table">
              <thead>
                <tr>
                  <th>Safehouse</th>
                  <th>Status</th>
                  <th>Residents</th>
                  <th>Capacity</th>
                  <th>Occupancy</th>
                  <th>High Risk</th>
                </tr>
              </thead>
              <tbody>
                {safehouses.map((s) => {
                  const pct = s.capacity > 0 ? Math.round((s.residentCount / s.capacity) * 100) : 0;
                  return (
                    <tr key={s.id}>
                      <td className="rp-table-name">{s.name}</td>
                      <td>
                        <span className={`rp-status-badge ${s.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
                          {s.status ?? 'Unknown'}
                        </span>
                      </td>
                      <td>{s.residentCount}</td>
                      <td>{s.capacity}</td>
                      <td>
                        <div className="rp-progress-bar">
                          <div
                            className={`rp-progress-fill ${pct >= 90 ? 'danger' : pct >= 70 ? 'warning' : ''}`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                        <span className="rp-progress-label">{pct}%</span>
                      </td>
                      <td>
                        {s.highRiskCount > 0 ? (
                          <span style={{ color: ORANGE, fontWeight: 600 }}>{s.highRiskCount}</span>
                        ) : (
                          <span style={{ color: 'var(--color-muted)' }}>0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 4: Reintegration Rates */}
      <div className="rp-section">
        <div className="rp-section-header">
          <ArrowRightLeft size={18} style={{ color: ORANGE }} />
          <h3 className="rp-section-title">Reintegration Rates</h3>
        </div>
        {reintegration && (
          <div className="rp-two-col">
            {/* Summary widgets */}
            <div className="rp-chart-card">
              <h4 className="rp-chart-subtitle">Reintegration Overview</h4>
              <div className="rp-reint-widgets">
                <div className="rp-reint-widget">
                  <div className="rp-reint-big" style={{ color: SAGE }}>{reintegration.reintegrated}</div>
                  <div className="rp-reint-sub">Successfully Reintegrated</div>
                </div>
                <div className="rp-reint-widget">
                  <div className="rp-reint-big" style={{ color: PRIMARY }}>
                    {reintegration.successRate.toFixed(1)}%
                  </div>
                  <div className="rp-reint-sub">Success Rate</div>
                </div>
                <div className="rp-reint-widget">
                  <div className="rp-reint-big" style={{ color: ORANGE }}>{reintegration.inProgress}</div>
                  <div className="rp-reint-sub">In Progress</div>
                </div>
                <div className="rp-reint-widget">
                  <div className="rp-reint-big" style={{ color: MUTED_BLUE }}>{reintegration.ready}</div>
                  <div className="rp-reint-sub">Ready for Reintegration</div>
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <div className="rp-progress-row">
                  <span className="rp-progress-row-label">Reintegrated</span>
                  <div className="rp-progress-bar wide">
                    <div
                      className="rp-progress-fill"
                      style={{
                        width: `${reintegration.total > 0 ? (reintegration.reintegrated / reintegration.total) * 100 : 0}%`,
                        backgroundColor: SAGE,
                      }}
                    />
                  </div>
                  <span className="rp-progress-count">{reintegration.reintegrated}/{reintegration.total}</span>
                </div>
                <div className="rp-progress-row">
                  <span className="rp-progress-row-label">In Progress</span>
                  <div className="rp-progress-bar wide">
                    <div
                      className="rp-progress-fill"
                      style={{
                        width: `${reintegration.total > 0 ? (reintegration.inProgress / reintegration.total) * 100 : 0}%`,
                        backgroundColor: ORANGE,
                      }}
                    />
                  </div>
                  <span className="rp-progress-count">{reintegration.inProgress}/{reintegration.total}</span>
                </div>
                <div className="rp-progress-row">
                  <span className="rp-progress-row-label">Not Started</span>
                  <div className="rp-progress-bar wide">
                    <div
                      className="rp-progress-fill"
                      style={{
                        width: `${reintegration.total > 0 ? (reintegration.notStarted / reintegration.total) * 100 : 0}%`,
                        backgroundColor: '#ccc',
                      }}
                    />
                  </div>
                  <span className="rp-progress-count">{reintegration.notStarted}/{reintegration.total}</span>
                </div>
              </div>
            </div>

            {/* Pie chart */}
            <div className="rp-chart-card">
              <h4 className="rp-chart-subtitle">Status Breakdown</h4>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={reintChartData.filter((d) => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={3}
                  >
                    {reintChartData.filter((d) => d.value > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: '0.78rem' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
