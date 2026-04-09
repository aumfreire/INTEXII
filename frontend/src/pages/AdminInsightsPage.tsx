import { useCallback, useEffect, useState } from 'react';
import { BrainCircuit, Heart, Home, Mail, Megaphone, Phone, Users } from 'lucide-react';
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
import '../styles/pages/admin-insights.css';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function RiskBadge({ tier }: { tier: RiskTier | null }) {
    if (!tier) return <span className="insights-sub">—</span>;
    const cls = tier === 'High' ? 'risk-high' : tier === 'Medium' ? 'risk-medium' : 'risk-low';
    return <span className={`insights-badge ${cls}`}>{tier}</span>;
}

function AlertBadge({ tier }: { tier: AlertTier | null }) {
    if (!tier) return <span className="insights-sub">—</span>;
    const cls = tier === 'Alert' ? 'alert-alert' : tier === 'Watch' ? 'alert-watch' : 'alert-stable';
    return <span className={`insights-badge ${cls}`}>{tier}</span>;
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

function SectionHeader({
    icon,
    title,
    runDate,
    first = false,
}: {
    icon: React.ReactNode;
    title: string;
    runDate: string | null;
    first?: boolean;
}) {
    return (
        <div className="insights-section-header" style={first ? { borderTop: 'none', paddingTop: 0, marginTop: 0 } : undefined}>
            <h3 className="insights-section-title">
                <span className="insights-section-title-icon">{icon}</span>
                {title}
            </h3>
            {runDate ? (
                <span className="insights-run-date">
                    Last updated: <strong>{runDate}</strong>
                </span>
            ) : (
                <span className="insights-run-date">No data yet — run the pipeline first</span>
            )}
        </div>
    );
}

function TierSummary({ data, field }: { data: Record<string, unknown>[]; field: string }) {
    const counts = { High: 0, Medium: 0, Low: 0, Alert: 0, Watch: 0, Stable: 0 };
    for (const row of data) {
        const tier = row[field] as string;
        if (tier in counts) counts[tier as keyof typeof counts]++;
    }

    // Show risk or alert tiers depending on what is present
    const hasAlert = counts.Alert + counts.Watch + counts.Stable > 0;
    if (hasAlert) {
        return (
            <div className="insights-tier-summary">
                <span className="insights-tier-pill alert">{counts.Alert} Alert</span>
                <span className="insights-tier-pill watch">{counts.Watch} Watch</span>
                <span className="insights-tier-pill stable">{counts.Stable} Stable</span>
            </div>
        );
    }
    return (
        <div className="insights-tier-summary">
            <span className="insights-tier-pill high">{counts.High} High</span>
            <span className="insights-tier-pill medium">{counts.Medium} Medium</span>
            <span className="insights-tier-pill low">{counts.Low} Low</span>
        </div>
    );
}

function ContactButtons({ email, phone }: { email?: string | null; phone?: string | null }) {
    return (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {email && (
                <a href={`mailto:${email}`} className="insights-contact-btn primary" title={email}>
                    <Mail size={13} />
                    Email
                </a>
            )}
            {phone && (
                <a href={`tel:${phone}`} className="insights-contact-btn" style={{ display: 'inline-flex' }}>
                    <Phone size={13} />
                    {phone}
                </a>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Donor Lapse Section
// ─────────────────────────────────────────────────────────────────────────────

function DonorSection({ result }: { result: InsightResponse<DonorLapseRecord> | null }) {
    if (!result) return <div className="insights-empty">Loading donor predictions…</div>;
    if (result.data.length === 0)
        return <div className="insights-empty">No donor predictions available. Run the pipeline to generate data.</div>;

    return (
        <>
            <TierSummary data={result.data as unknown as Record<string, unknown>[]} field="riskTier" />
            <div className="insights-table-wrap">
                <div className="insights-table-scroll">
                    <table className="insights-table">
                        <thead>
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
                                        <div className="insights-name">{d.displayName ?? '—'}</div>
                                        <div className="insights-sub">{d.supporterType}</div>
                                    </td>
                                    <td><RiskBadge tier={d.riskTier} /></td>
                                    <td>{d.recencyDays != null ? `${Math.round(d.recencyDays)} days` : '—'}</td>
                                    <td>{formatPHP(d.valueSum)}</td>
                                    <td>{d.topChannelSource ?? '—'}</td>
                                    <td>{d.region ?? '—'}</td>
                                    <td><ContactButtons email={d.email} phone={d.phone} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Resident Risk Section
// ─────────────────────────────────────────────────────────────────────────────

function ResidentSection({ result }: { result: InsightResponse<ResidentRiskRecord> | null }) {
    const [expanded, setExpanded] = useState<number | null>(null);

    if (!result) return <div className="insights-empty">Loading resident predictions…</div>;
    if (result.data.length === 0)
        return <div className="insights-empty">No resident predictions available. Run the pipeline to generate data.</div>;

    return (
        <>
            <TierSummary data={result.data as unknown as Record<string, unknown>[]} field="overallRisk" />
            <div className="insights-table-wrap">
                <div className="insights-table-scroll">
                    <table className="insights-table">
                        <thead>
                            <tr>
                                <th>Resident</th>
                                <th>Category</th>
                                <th>Health</th>
                                <th>Education</th>
                                <th>Incident</th>
                                <th>Overall</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {result.data.map((r) => (
                                <>
                                    <tr key={r.residentId}>
                                        <td>
                                            <div className="insights-name">{r.caseControlNo ?? `RES-${r.residentId}`}</div>
                                            {r.internalCode && <div className="insights-sub">{r.internalCode}</div>}
                                        </td>
                                        <td>{r.caseCategory ?? '—'}</td>
                                        <td><RiskBadge tier={r.healthRisk} /></td>
                                        <td><RiskBadge tier={r.educationRisk} /></td>
                                        <td><RiskBadge tier={r.incidentRisk} /></td>
                                        <td><RiskBadge tier={r.overallRisk} /></td>
                                        <td>
                                            <button
                                                className="insights-expand-btn"
                                                onClick={() => setExpanded(expanded === r.residentId ? null : r.residentId)}
                                            >
                                                {expanded === r.residentId ? 'Hide' : 'View'}
                                            </button>
                                        </td>
                                    </tr>
                                    {expanded === r.residentId && (
                                        <tr key={`${r.residentId}-detail`} className="expanded-row">
                                            <td colSpan={7}>
                                                <div className="insights-detail-panel">
                                                    <div className="insights-detail-grid">
                                                        <div className="insights-detail-col">
                                                            <div className="insights-detail-heading">
                                                                <RiskBadge tier={r.healthRisk} /> Health
                                                            </div>
                                                            <p className="insights-detail-reason">{r.healthRiskReason}</p>
                                                            {r.lastHealthScore != null && (
                                                                <span className="insights-detail-meta">
                                                                    Last score: <strong>{formatScore(r.lastHealthScore)}/5</strong>
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="insights-detail-col">
                                                            <div className="insights-detail-heading">
                                                                <RiskBadge tier={r.educationRisk} /> Education
                                                            </div>
                                                            <p className="insights-detail-reason">{r.educationRiskReason}</p>
                                                            <span className="insights-detail-meta">
                                                                {r.lastAttendanceRate != null && `Attendance: ${formatPct(r.lastAttendanceRate * 100)}`}
                                                                {r.lastAttendanceRate != null && r.lastProgressPercent != null && ' · '}
                                                                {r.lastProgressPercent != null && `Progress: ${formatPct(r.lastProgressPercent)}`}
                                                            </span>
                                                        </div>
                                                        <div className="insights-detail-col">
                                                            <div className="insights-detail-heading">
                                                                <RiskBadge tier={r.incidentRisk} /> Incidents
                                                            </div>
                                                            <p className="insights-detail-reason">{r.incidentRiskReason}</p>
                                                            <span className="insights-detail-meta">
                                                                Last 30d: <strong>{r.incidentsLast30d ?? 0}</strong>
                                                                {' · '}
                                                                Last 90d: <strong>{r.incidentsLast90d ?? 0}</strong>
                                                                {r.activePlanStatus && ` · Plan: ${r.activePlanStatus}`}
                                                                {r.planTargetDate && ` · Target: ${r.planTargetDate}`}
                                                            </span>
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
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Safehouse Health Section
// ─────────────────────────────────────────────────────────────────────────────

function SafehouseSection({ result }: { result: InsightResponse<SafehouseHealthRecord> | null }) {
    if (!result) return <div className="insights-empty">Loading safehouse predictions…</div>;
    if (result.data.length === 0)
        return <div className="insights-empty">No safehouse predictions available. Run the pipeline to generate data.</div>;

    return (
        <div className="insights-safehouse-grid">
            {result.data.map((s) => {
                const tier = s.alertTier ?? 'Stable';
                const educPct = s.predAvgEducationProgress ?? 0;
                const healthPct = s.predAvgHealthScore != null ? (s.predAvgHealthScore / 5) * 100 : 0;
                const educClass = educPct < 50 ? 'bad' : educPct < 70 ? 'warn' : 'good';
                const healthClass = healthPct < 50 ? 'bad' : healthPct < 70 ? 'warn' : 'good';
                const incidentBad = s.predIncidentCount != null && s.predIncidentCount > 0.5;

                return (
                    <div key={s.safehouseId} className={`insights-safehouse-card ${tier.toLowerCase()}`}>
                        <div className="insights-safehouse-card-header">
                            <div>
                                <div className="insights-safehouse-name">{s.name ?? s.safehouseCode}</div>
                                <div className="insights-safehouse-meta">{s.region} · {s.safehouseCode}</div>
                            </div>
                            <AlertBadge tier={s.alertTier} />
                        </div>

                        <div>
                            <div className="insights-progress-label">
                                <span>Education Progress</span>
                                <strong>{formatPct(s.predAvgEducationProgress)}</strong>
                            </div>
                            <div className="insights-progress-track">
                                <div
                                    className={`insights-progress-fill ${educClass}`}
                                    style={{ width: `${Math.min(educPct, 100)}%` }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="insights-progress-label">
                                <span>Health Score</span>
                                <strong>{formatScore(s.predAvgHealthScore)} / 5</strong>
                            </div>
                            <div className="insights-progress-track">
                                <div
                                    className={`insights-progress-fill ${healthClass}`}
                                    style={{ width: `${healthPct}%` }}
                                />
                            </div>
                        </div>

                        <div className="insights-safehouse-footer">
                            <span>Predicted Incidents</span>
                            <strong className={incidentBad ? 'bad' : 'good'}>
                                {s.predIncidentCount != null ? s.predIncidentCount.toFixed(1) : '—'}
                            </strong>
                        </div>
                        {s.monthStart && (
                            <div className="insights-safehouse-footer" style={{ marginTop: '4px' }}>
                                <span>Forecast for</span>
                                <span>{s.monthStart.slice(0, 10)}</span>
                            </div>
                        )}
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
    if (!result) return <div className="insights-empty">Loading social engagement predictions…</div>;
    if (result.data.length === 0)
        return <div className="insights-empty">No social engagement predictions available. Run the pipeline to generate data.</div>;

    return (
        <>
            <TierSummary data={result.data as unknown as Record<string, unknown>[]} field="engagementTier" />
            <div className="insights-table-wrap">
                <div className="insights-table-scroll">
                    <table className="insights-table">
                        <thead>
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
                                        <div className="insights-name">{s.displayName ?? '—'}</div>
                                        <div className="insights-sub">{s.supporterType} · {s.region}</div>
                                    </td>
                                    <td><RiskBadge tier={s.engagementTier} /></td>
                                    <td style={{ fontSize: '0.85rem' }}>{s.suggestedAction ?? '—'}</td>
                                    <td>{s.preferredPlatform ?? '—'}</td>
                                    <td>{s.recencyDays != null ? `${Math.round(s.recencyDays)} days` : '—'}</td>
                                    <td><ContactButtons email={s.email} phone={s.phone} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Social Media Action Section (static / presentational)
// ─────────────────────────────────────────────────────────────────────────────

const socialActionCards = [
    {
        stat: '8x',
        headline: 'Open with a name, not a statistic.',
        body: 'Posts that started with a specific person ("Patyia*", "Grace*", "Rob") averaged 8x the engagement of posts that opened with general awareness language. Use a pseudonym + asterisk to protect privacy.',
    },
    {
        stat: '18 of 20',
        headline: 'Use 0\u20132 hashtags. That\u2019s it.',
        body: '18 of the top 20 highest-engagement posts in our benchmark used zero hashtags. Hashtag spam signals \u201Cbrand\u201D to the algorithm and gets throttled. Put your energy into the first line of the caption instead.',
    },
    {
        stat: '7x',
        headline: 'Tie posts to a cultural moment within 24 hours.',
        body: 'The single best-performing carousel in our benchmark hijacked Stranger Things Season 5 and earned 7x the account\u2019s median engagement. Awareness days, holidays, show launches, and news moments all consistently outperform evergreen content.',
    },
    {
        stat: '3x',
        headline: 'Post on Saturday or Sunday.',
        body: 'Weekend posts averaged a 0.29% engagement rate versus 0.10% on weekdays \u2014 nearly 3x better. Most nonprofits post Tuesday\u2013Thursday, leaving the weekend wide open.',
    },
    {
        stat: '$1M',
        headline: 'Lead with a specific number when announcing impact.',
        body: '\u201C$1 million raised,\u201D \u201C1 million children reached,\u201D \u201C20 years ago\u201D \u2014 milestone posts with concrete numbers landed in the top quartile every time. Vague phrases like \u201Cpowerful work happening\u201D landed in the bottom. Specificity converts.',
    },
];

function SocialMediaActionSection() {
    return (
        <div>
            <div className="insights-section-header">
                <div>
                    <h3 className="insights-section-title">
                        <span className="insights-section-title-icon"><Megaphone size={18} /></span>
                        Social Media Action
                    </h3>
                    <p className="social-action-subtitle">
                        Five evidence-backed moves to boost engagement. Pick one. Do it this week.
                    </p>
                </div>
            </div>

            <div className="social-action-grid">
                {socialActionCards.map((card) => (
                    <div key={card.stat} className="social-action-card">
                        <div className="social-action-stat">{card.stat}</div>
                        <div className="social-action-headline">{card.headline}</div>
                        <p className="social-action-body">{card.body}</p>
                        <span className="social-action-cta">Try this &rarr;</span>
                    </div>
                ))}
            </div>

            <p className="social-action-footer">
                Source: analysis of 134 posts from Love146, A21, and Dressember (April 2026).
            </p>
        </div>
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
        <div>
            <div className="admin-page-header">
                <h1 className="admin-page-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <BrainCircuit size={28} style={{ color: 'var(--color-primary)' }} />
                    Action Insights
                </h1>
                <p className="admin-page-subtitle">
                    Predictive analytics for donors, residents, safehouses, and social media engagement.
                    Data refreshes automatically on the 1st of every month.
                </p>
            </div>

            {error && (
                <AlertBanner message={error} type="warning" onClose={() => setError('')} />
            )}

            <div
                style={{
                    backgroundColor: 'var(--color-white)',
                    borderRadius: 'var(--radius-md)',
                    padding: '28px 32px',
                    boxShadow: 'var(--shadow-sm)',
                }}
            >
                {/* ── Donor Lapse ── */}
                <SectionHeader
                    icon={<Users size={18} />}
                    title="Donor Relations — Lapse Risk"
                    runDate={donorResult?.runDate ?? null}
                    first
                />
                <DonorSection result={donorResult} />

                {/* ── Resident Risk ── */}
                <SectionHeader
                    icon={<Heart size={18} />}
                    title="Resident 30-Day Risk"
                    runDate={residentResult?.runDate ?? null}
                />
                <ResidentSection result={residentResult} />

                {/* ── Safehouse Health ── */}
                <SectionHeader
                    icon={<Home size={18} />}
                    title="Safehouse Health Forecast"
                    runDate={safehouseResult?.runDate ?? null}
                />
                <SafehouseSection result={safehouseResult} />

                {/* ── Social Media Engagement ── */}
                <SectionHeader
                    icon={<BrainCircuit size={18} />}
                    title="Social Media Donor Engagement"
                    runDate={socialResult?.runDate ?? null}
                />
                <SocialSection result={socialResult} />

                {/* ── Social Media Action (static) ── */}
                <SocialMediaActionSection />
            </div>
        </div>
    );
}
