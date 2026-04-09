import { useCallback, useEffect, useState } from 'react';
import { BrainCircuit, Heart, Home, Mail, Phone, Users } from 'lucide-react';
import AlertBanner from '../components/ui/AlertBanner';
import {
    getDonorLapse,
    getSafehouseHealth,
    getResidentRisk,
    getSocialEngagement,
} from '../lib/insightsAPI';
import type {
    DonorLapseRecord,
    InsightResponse,
    ResidentRiskRecord,
    RiskTier,
    AlertTier,
    SafehouseHealthRecord,
    SocialEngagementRecord,
} from '../types/InsightTypes';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function riskBadge(tier: RiskTier | null) {
    if (!tier) return null;
    const map: Record<RiskTier, string> = {
        High: 'danger',
        Medium: 'warning',
        Low: 'success',
    };
    return (
        <span className={`badge bg-${map[tier]} text-${tier === 'Medium' ? 'dark' : 'white'}`}>
            {tier}
        </span>
    );
}

function alertBadge(tier: AlertTier | null) {
    if (!tier) return null;
    const map: Record<AlertTier, string> = {
        Alert: 'danger',
        Watch: 'warning',
        Stable: 'success',
    };
    return (
        <span className={`badge bg-${map[tier]} text-${tier === 'Watch' ? 'dark' : 'white'}`}>
            {tier}
        </span>
    );
}

function formatPHP(value: number | null) {
    if (value == null) return '—';
    return `₱${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function formatPct(value: number | null) {
    if (value == null) return '—';
    return `${value.toFixed(1)}%`;
}

function formatScore(value: number | null) {
    if (value == null) return '—';
    return value.toFixed(2);
}

function RunDateBadge({ date }: { date: string | null }) {
    if (!date) return <span className="text-muted small">No data yet — run the pipeline first</span>;
    return <span className="text-muted small">Last updated: <strong>{date}</strong></span>;
}

function SectionHeader({ icon, title, runDate }: { icon: React.ReactNode; title: string; runDate: string | null }) {
    return (
        <div className="d-flex align-items-center justify-content-between mb-3 mt-5 pt-3 border-top">
            <div className="d-flex align-items-center gap-2">
                {icon}
                <h5 className="mb-0">{title}</h5>
            </div>
            <RunDateBadge date={runDate} />
        </div>
    );
}

function TierSummary({ data, field }: { data: { [key: string]: unknown }[]; field: string }) {
    const counts = { High: 0, Medium: 0, Low: 0 };
    for (const row of data) {
        const tier = row[field] as string;
        if (tier in counts) counts[tier as keyof typeof counts]++;
    }
    return (
        <div className="d-flex gap-3 mb-3">
            <span className="badge bg-danger fs-6 px-3 py-2">{counts.High} High</span>
            <span className="badge bg-warning text-dark fs-6 px-3 py-2">{counts.Medium} Medium</span>
            <span className="badge bg-success fs-6 px-3 py-2">{counts.Low} Low</span>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Donor Lapse Section
// ─────────────────────────────────────────────────────────────────────────────

function DonorSection({ result }: { result: InsightResponse<DonorLapseRecord> | null }) {
    if (!result) return <div className="text-muted">Loading...</div>;

    return (
        <>
            <TierSummary data={result.data as unknown as { [key: string]: unknown }[]} field="riskTier" />
            {result.data.length === 0 ? (
                <p className="text-muted">No donor predictions available. Run the pipeline to generate data.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Name</th>
                                <th>Risk</th>
                                <th>Days Since Donation</th>
                                <th>Total Given</th>
                                <th>Channel</th>
                                <th>Region</th>
                                <th>Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.data.map((d) => (
                                <tr key={d.supporterId}>
                                    <td>
                                        <div className="fw-semibold">{d.displayName ?? '—'}</div>
                                        <div className="text-muted small">{d.supporterType}</div>
                                    </td>
                                    <td>{riskBadge(d.riskTier)}</td>
                                    <td>{d.recencyDays != null ? `${Math.round(d.recencyDays)} days` : '—'}</td>
                                    <td>{formatPHP(d.valueSum)}</td>
                                    <td>{d.topChannelSource ?? '—'}</td>
                                    <td>{d.region ?? '—'}</td>
                                    <td>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {d.email && (
                                                <a
                                                    href={`mailto:${d.email}`}
                                                    className="btn btn-sm btn-outline-primary"
                                                    title={d.email}
                                                >
                                                    <Mail size={14} className="me-1" />
                                                    Email
                                                </a>
                                            )}
                                            {d.phone && (
                                                <a
                                                    href={`tel:${d.phone}`}
                                                    className="btn btn-sm btn-outline-secondary d-md-none"
                                                    title={d.phone}
                                                >
                                                    <Phone size={14} className="me-1" />
                                                    Call
                                                </a>
                                            )}
                                            {d.phone && (
                                                <span
                                                    className="btn btn-sm btn-outline-secondary d-none d-md-inline-flex align-items-center gap-1"
                                                    title="Click to copy"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => void navigator.clipboard.writeText(d.phone!)}
                                                >
                                                    <Phone size={14} />
                                                    {d.phone}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Resident Risk Section
// ─────────────────────────────────────────────────────────────────────────────

function ResidentSection({ result }: { result: InsightResponse<ResidentRiskRecord> | null }) {
    const [expanded, setExpanded] = useState<number | null>(null);

    if (!result) return <div className="text-muted">Loading...</div>;

    return (
        <>
            <TierSummary data={result.data as unknown as { [key: string]: unknown }[]} field="overallRisk" />
            {result.data.length === 0 ? (
                <p className="text-muted">No resident predictions available. Run the pipeline to generate data.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Resident ID</th>
                                <th>Category</th>
                                <th>Health</th>
                                <th>Education</th>
                                <th>Incident</th>
                                <th>Overall</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.data.map((r) => (
                                <>
                                    <tr key={r.residentId}>
                                        <td>
                                            <div className="fw-semibold">{r.caseControlNo ?? `RES-${r.residentId}`}</div>
                                            {r.internalCode && (
                                                <div className="text-muted small">{r.internalCode}</div>
                                            )}
                                        </td>
                                        <td>{r.caseCategory ?? '—'}</td>
                                        <td>{riskBadge(r.healthRisk)}</td>
                                        <td>{riskBadge(r.educationRisk)}</td>
                                        <td>{riskBadge(r.incidentRisk)}</td>
                                        <td>{riskBadge(r.overallRisk)}</td>
                                        <td>
                                            <button
                                                className="btn btn-sm btn-outline-secondary"
                                                onClick={() => setExpanded(expanded === r.residentId ? null : r.residentId)}
                                            >
                                                {expanded === r.residentId ? 'Hide' : 'View'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expanded === r.residentId && (
                                        <tr key={`${r.residentId}-detail`} className="table-light">
                                            <td colSpan={7}>
                                                <div className="p-3">
                                                    <div className="row g-3">
                                                        <div className="col-12 col-md-4">
                                                            <div className="fw-semibold mb-1 d-flex align-items-center gap-1">
                                                                {riskBadge(r.healthRisk)} Health
                                                            </div>
                                                            <p className="mb-1 small">{r.healthRiskReason}</p>
                                                            {r.lastHealthScore != null && (
                                                                <p className="text-muted small mb-0">
                                                                    Last score: <strong>{formatScore(r.lastHealthScore)}/5</strong>
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="col-12 col-md-4">
                                                            <div className="fw-semibold mb-1 d-flex align-items-center gap-1">
                                                                {riskBadge(r.educationRisk)} Education
                                                            </div>
                                                            <p className="mb-1 small">{r.educationRiskReason}</p>
                                                            <div className="text-muted small">
                                                                {r.lastAttendanceRate != null && (
                                                                    <span className="me-3">Attendance: <strong>{formatPct(r.lastAttendanceRate * 100)}</strong></span>
                                                                )}
                                                                {r.lastProgressPercent != null && (
                                                                    <span>Progress: <strong>{formatPct(r.lastProgressPercent)}</strong></span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-12 col-md-4">
                                                            <div className="fw-semibold mb-1 d-flex align-items-center gap-1">
                                                                {riskBadge(r.incidentRisk)} Incidents
                                                            </div>
                                                            <p className="mb-1 small">{r.incidentRiskReason}</p>
                                                            <div className="text-muted small">
                                                                <span className="me-3">Last 30d: <strong>{r.incidentsLast30d ?? 0}</strong></span>
                                                                <span>Last 90d: <strong>{r.incidentsLast90d ?? 0}</strong></span>
                                                            </div>
                                                            {r.activePlanStatus && (
                                                                <div className="text-muted small mt-1">
                                                                    Plan status: <strong>{r.activePlanStatus}</strong>
                                                                    {r.planTargetDate && ` · Target: ${r.planTargetDate}`}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Safehouse Health Section
// ─────────────────────────────────────────────────────────────────────────────

function SafehouseSection({ result }: { result: InsightResponse<SafehouseHealthRecord> | null }) {
    if (!result) return <div className="text-muted">Loading...</div>;

    if (result.data.length === 0)
        return <p className="text-muted">No safehouse predictions available. Run the pipeline to generate data.</p>;

    return (
        <div className="row g-3">
            {result.data.map((s) => {
                const tier = s.alertTier ?? 'Stable';
                const borderColor = tier === 'Alert' ? '#dc3545' : tier === 'Watch' ? '#ffc107' : '#198754';
                const educPct = s.predAvgEducationProgress ?? 0;
                const healthPct = s.predAvgHealthScore != null ? (s.predAvgHealthScore / 5) * 100 : 0;

                return (
                    <div key={s.safehouseId} className="col-12 col-md-6 col-lg-4">
                        <div
                            className="border rounded-3 p-3 h-100 bg-white shadow-sm"
                            style={{ borderLeft: `4px solid ${borderColor} !important`, borderLeftWidth: '4px' }}
                        >
                            <div className="d-flex justify-content-between align-items-start mb-2">
                                <div>
                                    <div className="fw-bold">{s.name ?? s.safehouseCode}</div>
                                    <div className="text-muted small">{s.region} · {s.safehouseCode}</div>
                                </div>
                                {alertBadge(s.alertTier)}
                            </div>

                            <div className="mb-2">
                                <div className="d-flex justify-content-between small mb-1">
                                    <span>Education Progress</span>
                                    <strong>{formatPct(s.predAvgEducationProgress)}</strong>
                                </div>
                                <div className="progress" style={{ height: '6px' }}>
                                    <div
                                        className={`progress-bar ${educPct < 50 ? 'bg-danger' : educPct < 70 ? 'bg-warning' : 'bg-success'}`}
                                        style={{ width: `${Math.min(educPct, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="mb-2">
                                <div className="d-flex justify-content-between small mb-1">
                                    <span>Health Score</span>
                                    <strong>{formatScore(s.predAvgHealthScore)} / 5</strong>
                                </div>
                                <div className="progress" style={{ height: '6px' }}>
                                    <div
                                        className={`progress-bar ${healthPct < 50 ? 'bg-danger' : healthPct < 70 ? 'bg-warning' : 'bg-success'}`}
                                        style={{ width: `${healthPct}%` }}
                                    />
                                </div>
                            </div>

                            <div className="d-flex justify-content-between small text-muted mt-2">
                                <span>Predicted Incidents</span>
                                <strong className={s.predIncidentCount != null && s.predIncidentCount > 0.5 ? 'text-danger' : 'text-success'}>
                                    {s.predIncidentCount != null ? s.predIncidentCount.toFixed(1) : '—'}
                                </strong>
                            </div>

                            {s.monthStart && (
                                <div className="text-muted small mt-1">Forecast for: {s.monthStart.slice(0, 10)}</div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Social Engagement Section
// ─────────────────────────────────────────────────────────────────────────────

function SocialSection({ result }: { result: InsightResponse<SocialEngagementRecord> | null }) {
    if (!result) return <div className="text-muted">Loading...</div>;

    return (
        <>
            <TierSummary data={result.data as unknown as { [key: string]: unknown }[]} field="engagementTier" />
            {result.data.length === 0 ? (
                <p className="text-muted">No social engagement predictions available. Run the pipeline to generate data.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th>Name</th>
                                <th>Engagement</th>
                                <th>Suggested Action</th>
                                <th>Platform</th>
                                <th>Days Since Activity</th>
                                <th>Contact</th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.data.map((s) => (
                                <tr key={s.supporterId}>
                                    <td>
                                        <div className="fw-semibold">{s.displayName ?? '—'}</div>
                                        <div className="text-muted small">{s.supporterType} · {s.region}</div>
                                    </td>
                                    <td>{riskBadge(s.engagementTier)}</td>
                                    <td>
                                        <span className="small">{s.suggestedAction ?? '—'}</span>
                                    </td>
                                    <td>{s.preferredPlatform ?? '—'}</td>
                                    <td>{s.recencyDays != null ? `${Math.round(s.recencyDays)} days` : '—'}</td>
                                    <td>
                                        <div className="d-flex gap-2 flex-wrap">
                                            {s.email && (
                                                <a
                                                    href={`mailto:${s.email}`}
                                                    className="btn btn-sm btn-outline-primary"
                                                    title={s.email}
                                                >
                                                    <Mail size={14} className="me-1" />
                                                    Email
                                                </a>
                                            )}
                                            {s.phone && (
                                                <a
                                                    href={`tel:${s.phone}`}
                                                    className="btn btn-sm btn-outline-secondary d-md-none"
                                                >
                                                    <Phone size={14} className="me-1" />
                                                    Call
                                                </a>
                                            )}
                                            {s.phone && (
                                                <span
                                                    className="btn btn-sm btn-outline-secondary d-none d-md-inline-flex align-items-center gap-1"
                                                    style={{ cursor: 'pointer' }}
                                                    onClick={() => void navigator.clipboard.writeText(s.phone!)}
                                                    title="Click to copy"
                                                >
                                                    <Phone size={14} />
                                                    {s.phone}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AdminInsightsPage() {
    const [donorResult, setDonorResult] = useState<InsightResponse<DonorLapseRecord> | null>(null);
    const [safehouseResult, setSafehouseResult] = useState<InsightResponse<SafehouseHealthRecord> | null>(null);
    const [residentResult, setResidentResult] = useState<InsightResponse<ResidentRiskRecord> | null>(null);
    const [socialResult, setSocialResult] = useState<InsightResponse<SocialEngagementRecord> | null>(null);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        setError('');
        try {
            const [donor, safehouse, resident, social] = await Promise.all([
                getDonorLapse(),
                getSafehouseHealth(),
                getResidentRisk(),
                getSocialEngagement(),
            ]);
            setDonorResult(donor);
            setSafehouseResult(safehouse);
            setResidentResult(resident);
            setSocialResult(social);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load insights.');
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    return (
        <div className="container py-5">
            <div className="login-card" style={{ maxWidth: '1200px' }}>
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-2">
                    <div>
                        <h2 className="mb-1 d-flex align-items-center gap-2">
                            <BrainCircuit size={26} />
                            ML Insights
                        </h2>
                        <p className="login-subtitle mb-0">
                            Predictive analytics for donors, residents, safehouses, and social media engagement.
                            Data refreshes automatically on the 1st of every month.
                        </p>
                    </div>
                </div>

                {error && (
                    <AlertBanner message={error} type="warning" onClose={() => setError('')} />
                )}

                {/* ── Donor Lapse ── */}
                <SectionHeader
                    icon={<Users size={20} className="text-danger" />}
                    title="Donor Relations — Lapse Risk"
                    runDate={donorResult?.runDate ?? null}
                />
                <DonorSection result={donorResult} />

                {/* ── Resident Risk ── */}
                <SectionHeader
                    icon={<Heart size={20} className="text-danger" />}
                    title="Resident 30-Day Risk"
                    runDate={residentResult?.runDate ?? null}
                />
                <ResidentSection result={residentResult} />

                {/* ── Safehouse Health ── */}
                <SectionHeader
                    icon={<Home size={20} className="text-primary" />}
                    title="Safehouse Health Forecast"
                    runDate={safehouseResult?.runDate ?? null}
                />
                <SafehouseSection result={safehouseResult} />

                {/* ── Social Media Engagement ── */}
                <SectionHeader
                    icon={<BrainCircuit size={20} className="text-success" />}
                    title="Social Media Donor Engagement"
                    runDate={socialResult?.runDate ?? null}
                />
                <SocialSection result={socialResult} />
            </div>
        </div>
    );
}
