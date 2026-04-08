import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Home,
  Users,
  Calendar,
  AlertTriangle,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Circle,
  Lock,
  Loader2,
  Inbox,
  UserPlus,
  MapPin,
  Phone,
  ArrowRightLeft,
} from 'lucide-react';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import AlertBanner from '../components/ui/AlertBanner';
import '../styles/pages/resident-detail.css';

/* ===== Types ===== */
type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
type CaseStatus = 'active' | 'intake' | 'reintegration' | 'closed';
type Tab = 'overview' | 'recordings' | 'visits' | 'conferences' | 'reintegration';

/* ===== Mock Data ===== */
const mockResident = {
  id: '1',
  name: 'Grace M.',
  initials: 'GM',
  code: 'HFG-2024-001',
  caseControlNumber: 'CCN-2024-0147',
  safehouse: 'Haven House A',
  caseStatus: 'active' as CaseStatus,
  riskLevel: 'high' as RiskLevel,
  assignedWorker: 'Maria Johnson',
  caseCategory: 'Trafficking',
  caseSubCategory: 'Domestic',
  admissionDate: '2024-09-15',
  dateOfBirth: '2010-03-22',
  age: 16,
  gender: 'Female',
  nationality: 'Nigerian',
  education: 'JSS 3 — Currently enrolled',
  referralSource: 'NAPTIP Lagos Office',
  referralDate: '2024-09-12',
  referralOfficer: 'Inspector Adamu K.',
  familyStatus: 'Mother located, father deceased',
  siblings: '2 younger brothers (ages 9 and 12)',
  familyContact: 'Mother — Mrs. Florence M.',
  reintegrationStatus: 'Not Started',
  reintegrationType: 'Family Reunification',
};

const mockAlerts = [
  { icon: AlertTriangle, color: 'var(--color-primary)', text: 'Risk level elevated — last assessed Apr 5', date: '2 days ago' },
  { icon: Calendar, color: 'var(--color-primary-light)', text: 'Case conference scheduled Apr 14', date: 'In 6 days' },
  { icon: FileText, color: 'var(--color-sage)', text: 'Process recording due this week', date: 'Apr 11' },
];

const mockRecordings = [
  {
    id: '1', date: '2026-04-05', worker: 'Maria Johnson', sessionType: 'Individual Counseling',
    emotionStart: 'Withdrawn', emotionEnd: 'Calm, more open',
    progressNoted: true, concernFlagged: true, referralMade: false,
    summary: 'Grace was initially quiet and avoided eye contact. After gentle prompting, she shared concerns about upcoming family contact. She expressed fear about returning home but also longing for her mother. Session focused on grounding techniques and safety planning.',
  },
  {
    id: '2', date: '2026-03-28', worker: 'Maria Johnson', sessionType: 'Group Session',
    emotionStart: 'Anxious', emotionEnd: 'Engaged',
    progressNoted: true, concernFlagged: false, referralMade: false,
    summary: 'Participated in peer support circle. Initially reluctant but eventually shared about her education goals. Responded positively to encouragement from peers.',
  },
  {
    id: '3', date: '2026-03-20', worker: 'Maria Johnson', sessionType: 'Individual Counseling',
    emotionStart: 'Tearful', emotionEnd: 'Settled',
    progressNoted: false, concernFlagged: true, referralMade: true,
    summary: 'Difficult session. Grace disclosed nightmares recurring over the past week. Referred to trauma-focused CBT specialist. Discussed coping strategies for nighttime distress. Staff alerted for additional night check-ins.',
  },
];

const mockVisits = [
  {
    id: '1', date: '2026-03-15', type: 'Initial Assessment', worker: 'Sarah Okonkwo',
    cooperation: 'Cooperative', safetyConcern: false, followUpNeeded: true,
    notes: 'Home environment assessed. Mother was welcoming and expressed desire for reunification. Living conditions modest but adequate. Two younger brothers present and appeared well-cared for.',
  },
  {
    id: '2', date: '2026-02-28', type: 'Follow-up', worker: 'Maria Johnson',
    cooperation: 'Partially Cooperative', safetyConcern: true, followUpNeeded: true,
    notes: 'Neighbor reported unfamiliar male visitors. Mother was initially defensive but agreed to further engagement. Safety assessment flagged for review at next case conference.',
  },
];

const mockConferences = [
  {
    id: '1', date: '2026-04-14', upcoming: true,
    attendees: 'Maria Johnson, Sarah Okonkwo, Dr. Bello (Psychologist), Legal Advisor',
    notes: 'Agenda: Review risk assessment, discuss reintegration readiness, plan family mediation sessions.',
  },
  {
    id: '2', date: '2026-03-10', upcoming: false,
    attendees: 'Maria Johnson, Sarah Okonkwo, Program Director',
    notes: 'Agreed to extend shelter stay by 3 months. Education enrollment confirmed. Trauma therapy to continue bi-weekly. Home visit results discussed — safety concern noted for follow-up.',
  },
  {
    id: '3', date: '2026-01-20', upcoming: false,
    attendees: 'Maria Johnson, Intake Officer, Legal Advisor',
    notes: 'Initial case conference post-admission. Case plan established. Assigned social worker confirmed. Education assessment scheduled.',
  },
];

const mockInterventions = [
  'Bi-weekly individual trauma-focused counseling',
  'Weekly group peer support sessions',
  'Education re-enrollment and tutoring support',
  'Family mediation preparation (pending safety clearance)',
  'Life skills program — cooking and budgeting modules',
];

const mockMilestones = [
  { text: 'Intake assessment completed', done: true },
  { text: 'Case plan established', done: true },
  { text: 'Education enrollment confirmed', done: true },
  { text: 'Initial trauma assessment', done: true },
  { text: 'Family contact initiated', done: false },
  { text: 'Home safety assessment', done: false },
  { text: 'Family mediation sessions', done: false },
  { text: 'Community reintegration plan', done: false },
  { text: 'Post-reintegration follow-up schedule', done: false },
];

const mockBlockers = [
  { text: 'Safety concern from Feb home visit — needs resolution before family contact proceeds', date: 'Flagged Feb 28' },
  { text: 'Nightmares and sleep disturbance — trauma therapy progress being monitored', date: 'Noted Mar 20' },
];

/* ===== Helpers ===== */
const riskLabels: Record<RiskLevel, string> = { low: 'Low', moderate: 'Moderate', high: 'High', critical: 'Critical' };
const statusLabels: Record<CaseStatus, string> = { active: 'Active', intake: 'Intake', reintegration: 'Reintegration', closed: 'Closed' };

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ===== Component ===== */
export default function ResidentDetailPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [expandedRecording, setExpandedRecording] = useState<string | null>(null);
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const r = mockResident;
  const tabs: { key: Tab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'recordings', label: 'Process Recordings' },
    { key: 'visits', label: 'Home Visits' },
    { key: 'conferences', label: 'Case Conferences' },
    { key: 'reintegration', label: 'Reintegration' },
  ];

  /* Loading */
  if (isLoading) {
    return (
      <div>
        <Link to="/admin/caseload" className="rd-back">
          <ArrowLeft size={16} /> Back to Caseload
        </Link>
        <div className="rd-loading">
          <Loader2 size={32} className="spin-icon" style={{ color: 'var(--color-primary-light)' }} />
          <span className="rd-loading-text">Loading resident record...</span>
        </div>
      </div>
    );
  }

  /* Error */
  if (hasError) {
    return (
      <div>
        <Link to="/admin/caseload" className="rd-back">
          <ArrowLeft size={16} /> Back to Caseload
        </Link>
        <AlertBanner type="warning" message="Unable to load this resident's record. Please try again or contact support." />
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link to="/admin/caseload" className="rd-back">
        <ArrowLeft size={16} /> Back to Caseload
      </Link>

      {/* Header Card */}
      <div className="rd-header-card">
        <div className="rd-header-top">
          <div className="rd-header-identity">
            <div className="rd-avatar">{r.initials}</div>
            <div>
              <h1 className="rd-name">{r.name}</h1>
              <div className="rd-codes">
                <span className="rd-code-tag">{r.code}</span>
                <span className="rd-code-tag">{r.caseControlNumber}</span>
              </div>
            </div>
          </div>
          <div className="rd-header-actions">
            <SecondaryButton onClick={() => {}}>
              <FileText size={15} /> Add Recording
            </SecondaryButton>
            <PrimaryButton onClick={() => {}}>
              <Home size={15} /> Log Home Visit
            </PrimaryButton>
          </div>
        </div>
        <div className="rd-header-meta">
          <div className="rd-meta-item">
            <span className="rd-meta-label">Safehouse</span>
            <span className="rd-meta-value">{r.safehouse}</span>
          </div>
          <div className="rd-meta-item">
            <span className="rd-meta-label">Case Status</span>
            <span className={`rd-badge status-${r.caseStatus}`}>{statusLabels[r.caseStatus]}</span>
          </div>
          <div className="rd-meta-item">
            <span className="rd-meta-label">Risk Level</span>
            <span className={`rd-badge risk-${r.riskLevel}`}>
              <span className={`rd-risk-dot ${r.riskLevel}`} />
              {riskLabels[r.riskLevel]}
            </span>
          </div>
          <div className="rd-meta-item">
            <span className="rd-meta-label">Social Worker</span>
            <span className="rd-meta-value">{r.assignedWorker}</span>
          </div>
          <div className="rd-meta-item">
            <span className="rd-meta-label">Admitted</span>
            <span className="rd-meta-value">{formatDate(r.admissionDate)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="rd-tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`rd-tab ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Workspace: Main + Sidebar */}
      <div className="rd-workspace">
        <div>
          {/* ===== OVERVIEW TAB ===== */}
          {activeTab === 'overview' && (
            <>
              {/* Demographics */}
              <div className="rd-panel">
                <h3 className="rd-panel-title">Demographics</h3>
                <div className="rd-overview-grid" style={{ marginTop: '16px' }}>
                  <div className="rd-field">
                    <span className="rd-field-label">Date of Birth</span>
                    <span className="rd-field-value">{formatDate(r.dateOfBirth)} (Age {r.age})</span>
                  </div>
                  <div className="rd-field">
                    <span className="rd-field-label">Gender</span>
                    <span className="rd-field-value">{r.gender}</span>
                  </div>
                  <div className="rd-field">
                    <span className="rd-field-label">Nationality</span>
                    <span className="rd-field-value">{r.nationality}</span>
                  </div>
                  <div className="rd-field">
                    <span className="rd-field-label">Education</span>
                    <span className="rd-field-value">{r.education}</span>
                  </div>
                </div>
              </div>

              {/* Case Details */}
              <div className="rd-panel">
                <h3 className="rd-panel-title">Case Details</h3>
                <div className="rd-overview-grid" style={{ marginTop: '16px' }}>
                  <div className="rd-field">
                    <span className="rd-field-label">Category</span>
                    <span className="rd-field-value">{r.caseCategory}</span>
                  </div>
                  <div className="rd-field">
                    <span className="rd-field-label">Sub-Category</span>
                    <span className="rd-field-value">{r.caseSubCategory}</span>
                  </div>
                  <div className="rd-field">
                    <span className="rd-field-label">Admission Date</span>
                    <span className="rd-field-value">{formatDate(r.admissionDate)}</span>
                  </div>
                  <div className="rd-field">
                    <span className="rd-field-label">Reintegration Status</span>
                    <span className="rd-field-value">{r.reintegrationStatus}</span>
                  </div>
                </div>
              </div>

              {/* Family Profile */}
              <div className="rd-panel">
                <h3 className="rd-panel-title">Family Profile</h3>
                <div className="rd-overview-grid" style={{ marginTop: '16px' }}>
                  <div className="rd-field">
                    <span className="rd-field-label">Family Status</span>
                    <span className="rd-field-value">{r.familyStatus}</span>
                  </div>
                  <div className="rd-field">
                    <span className="rd-field-label">Siblings</span>
                    <span className="rd-field-value">{r.siblings}</span>
                  </div>
                  <div className="rd-field">
                    <span className="rd-field-label">Primary Contact</span>
                    <span className="rd-field-value">{r.familyContact}</span>
                  </div>
                </div>
              </div>

              {/* Referral Details */}
              <div className="rd-panel">
                <h3 className="rd-panel-title">Referral Details</h3>
                <div className="rd-overview-grid" style={{ marginTop: '16px' }}>
                  <div className="rd-field">
                    <span className="rd-field-label">Referral Source</span>
                    <span className="rd-field-value">{r.referralSource}</span>
                  </div>
                  <div className="rd-field">
                    <span className="rd-field-label">Referral Date</span>
                    <span className="rd-field-value">{formatDate(r.referralDate)}</span>
                  </div>
                  <div className="rd-field">
                    <span className="rd-field-label">Referring Officer</span>
                    <span className="rd-field-value">{r.referralOfficer}</span>
                  </div>
                </div>
              </div>

              {/* Restricted Notes */}
              <div className="rd-panel">
                <h3 className="rd-panel-title">Restricted Notes</h3>
                <div className="rd-restricted" style={{ marginTop: '16px' }}>
                  <Lock size={20} className="rd-restricted-icon" />
                  <div className="rd-restricted-text">
                    <strong>Access restricted.</strong> Detailed case notes and sensitive disclosures are available only to authorized case workers and supervisors.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ===== PROCESS RECORDINGS TAB ===== */}
          {activeTab === 'recordings' && (
            <div className="rd-panel">
              <div className="rd-panel-header">
                <h3 className="rd-panel-title">Process Recordings</h3>
                <PrimaryButton onClick={() => {}}>
                  <FileText size={15} /> Add Recording
                </PrimaryButton>
              </div>
              {mockRecordings.length === 0 ? (
                <div className="rd-empty">
                  <Inbox size={40} className="rd-empty-icon" />
                  <h4 className="rd-empty-title">No process recordings yet</h4>
                  <p className="rd-empty-text">Document your first session to begin tracking progress.</p>
                </div>
              ) : (
                <div className="rd-timeline">
                  {mockRecordings.map((rec) => {
                    const isExpanded = expandedRecording === rec.id;
                    return (
                      <div className="rd-record" key={rec.id}>
                        <div className="rd-record-header">
                          <span className="rd-record-date">{formatDate(rec.date)}</span>
                          <div className="rd-record-meta">
                            <span className="rd-record-meta-item">
                              <Users size={13} /> {rec.worker}
                            </span>
                            <span className="rd-record-meta-item">
                              <Clock size={13} /> {rec.sessionType}
                            </span>
                          </div>
                        </div>
                        <div className="rd-emotion">
                          <span className="rd-emotion-label">Start:</span>
                          <span className="rd-emotion-value">{rec.emotionStart}</span>
                          <span style={{ color: 'var(--color-light-gray)', margin: '0 4px' }}>→</span>
                          <span className="rd-emotion-label">End:</span>
                          <span className="rd-emotion-value">{rec.emotionEnd}</span>
                        </div>
                        <div className="rd-record-tags">
                          {rec.progressNoted && <span className="rd-record-tag progress">Progress</span>}
                          {rec.concernFlagged && <span className="rd-record-tag concern">Concern</span>}
                          {rec.referralMade && <span className="rd-record-tag referral">Referral</span>}
                        </div>
                        <p className="rd-record-summary">
                          {isExpanded ? rec.summary : rec.summary.slice(0, 140) + (rec.summary.length > 140 ? '...' : '')}
                        </p>
                        {rec.summary.length > 140 && (
                          <button
                            className="rd-expand-btn"
                            onClick={() => setExpandedRecording(isExpanded ? null : rec.id)}
                          >
                            {isExpanded ? <>Show less <ChevronUp size={14} /></> : <>Read more <ChevronDown size={14} /></>}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== HOME VISITS TAB ===== */}
          {activeTab === 'visits' && (
            <div className="rd-panel">
              <div className="rd-panel-header">
                <h3 className="rd-panel-title">Home Visits</h3>
                <PrimaryButton onClick={() => {}}>
                  <Home size={15} /> Log Home Visit
                </PrimaryButton>
              </div>
              {mockVisits.length === 0 ? (
                <div className="rd-empty">
                  <Inbox size={40} className="rd-empty-icon" />
                  <h4 className="rd-empty-title">No home visits recorded</h4>
                  <p className="rd-empty-text">Log a visit to begin documenting home assessments.</p>
                </div>
              ) : (
                <div className="rd-timeline">
                  {mockVisits.map((v) => {
                    const isExpanded = expandedVisit === v.id;
                    return (
                      <div className="rd-record" key={v.id}>
                        <div className="rd-record-header">
                          <span className="rd-record-date">{formatDate(v.date)}</span>
                          <div className="rd-record-meta">
                            <span className="rd-record-meta-item">
                              <Users size={13} /> {v.worker}
                            </span>
                            <span className="rd-record-meta-item">
                              <MapPin size={13} /> {v.type}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
                          <div className="rd-record-meta-item" style={{ fontSize: '0.82rem', color: 'var(--color-muted)' }}>
                            <span style={{ fontWeight: 500 }}>Cooperation:</span>&nbsp;
                            <span style={{ fontWeight: 600, color: 'var(--color-dark)' }}>{v.cooperation}</span>
                          </div>
                          {v.safetyConcern && (
                            <span className="rd-visit-indicator warning">
                              <AlertTriangle size={14} /> Safety Concern
                            </span>
                          )}
                          {!v.safetyConcern && (
                            <span className="rd-visit-indicator safe">
                              <Shield size={14} /> No Safety Concerns
                            </span>
                          )}
                          {v.followUpNeeded && (
                            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: 'var(--color-primary)' }}>
                              Follow-up needed
                            </span>
                          )}
                        </div>
                        <p className="rd-record-summary">
                          {isExpanded ? v.notes : v.notes.slice(0, 140) + (v.notes.length > 140 ? '...' : '')}
                        </p>
                        {v.notes.length > 140 && (
                          <button
                            className="rd-expand-btn"
                            onClick={() => setExpandedVisit(isExpanded ? null : v.id)}
                          >
                            {isExpanded ? <>Show less <ChevronUp size={14} /></> : <>Read more <ChevronDown size={14} /></>}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ===== CASE CONFERENCES TAB ===== */}
          {activeTab === 'conferences' && (
            <>
              {/* Upcoming */}
              <div className="rd-panel">
                <h3 className="rd-panel-title">
                  Upcoming Conferences
                </h3>
                <div style={{ marginTop: '16px' }}>
                  {mockConferences.filter((c) => c.upcoming).map((c) => (
                    <div className="rd-conference-card" key={c.id}>
                      <div className="rd-conference-date">
                        {formatDate(c.date)}
                        <span className="rd-upcoming-badge">
                          <Calendar size={11} /> Upcoming
                        </span>
                      </div>
                      <div className="rd-conference-attendees">Attendees: {c.attendees}</div>
                      <p className="rd-conference-notes">{c.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Past */}
              <div className="rd-panel">
                <h3 className="rd-panel-title">Past Conferences</h3>
                <div style={{ marginTop: '16px' }}>
                  {mockConferences.filter((c) => !c.upcoming).map((c) => (
                    <div className="rd-conference-card" key={c.id}>
                      <div className="rd-conference-date">{formatDate(c.date)}</div>
                      <div className="rd-conference-attendees">Attendees: {c.attendees}</div>
                      <p className="rd-conference-notes">{c.notes}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Intervention Highlights */}
              <div className="rd-panel">
                <h3 className="rd-panel-title">Active Intervention Plan</h3>
                <ul className="rd-interventions" style={{ marginTop: '16px' }}>
                  {mockInterventions.map((item, i) => (
                    <li className="rd-intervention-item" key={i}>
                      <ArrowRightLeft size={14} className="rd-intervention-icon" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* ===== REINTEGRATION TAB ===== */}
          {activeTab === 'reintegration' && (
            <>
              {/* Status Bar */}
              <div className="rd-reint-status-bar">
                <div>
                  <span className="rd-reint-status-label">Type</span>
                  <div className="rd-reint-status-value">{r.reintegrationType}</div>
                </div>
                <div>
                  <span className="rd-reint-status-label">Status</span>
                  <div className="rd-reint-status-value">{r.reintegrationStatus}</div>
                </div>
                <div>
                  <span className="rd-reint-status-label">Progress</span>
                  <div className="rd-reint-status-value">
                    {mockMilestones.filter((m) => m.done).length} of {mockMilestones.length} milestones
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div className="rd-panel">
                <h3 className="rd-panel-title">Milestones</h3>
                <ul className="rd-checklist" style={{ marginTop: '16px' }}>
                  {mockMilestones.map((m, i) => (
                    <li className="rd-checklist-item" key={i}>
                      {m.done ? (
                        <CheckCircle size={18} className="rd-check-icon done" />
                      ) : (
                        <Circle size={18} className="rd-check-icon pending" />
                      )}
                      <span className={`rd-checklist-text ${m.done ? 'done' : ''}`}>{m.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Blockers */}
              <div className="rd-panel">
                <h3 className="rd-panel-title">Blockers &amp; Follow-up Actions</h3>
                {mockBlockers.length === 0 ? (
                  <div className="rd-empty" style={{ padding: '24px' }}>
                    <p className="rd-empty-text" style={{ margin: 0 }}>No current blockers. Keep up the great work.</p>
                  </div>
                ) : (
                  <div style={{ marginTop: '16px' }}>
                    {mockBlockers.map((b, i) => (
                      <div className="rd-blocker" key={i}>
                        <AlertTriangle size={16} className="rd-blocker-icon" />
                        <div>
                          <div className="rd-blocker-text">{b.text}</div>
                          <div className="rd-blocker-date">{b.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ===== Sidebar ===== */}
        <div className="rd-sidebar">
          {/* Alerts & Next Actions */}
          <div className="rd-sidebar-card">
            <h4 className="rd-sidebar-title">Alerts &amp; Next Actions</h4>
            {mockAlerts.map((a, i) => {
              const Icon = a.icon;
              return (
                <div className="rd-alert-item" key={i}>
                  <Icon size={16} className="rd-alert-icon" style={{ color: a.color }} />
                  <div>
                    <div className="rd-alert-text">{a.text}</div>
                    <div className="rd-alert-date">{a.date}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Info */}
          <div className="rd-sidebar-card">
            <h4 className="rd-sidebar-title">Quick Reference</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="rd-field">
                <span className="rd-field-label">Case Category</span>
                <span className="rd-field-value">{r.caseCategory}</span>
              </div>
              <div className="rd-field">
                <span className="rd-field-label">Safehouse</span>
                <span className="rd-field-value">{r.safehouse}</span>
              </div>
              <div className="rd-field">
                <span className="rd-field-label">Age</span>
                <span className="rd-field-value">{r.age} years old</span>
              </div>
              <div className="rd-field">
                <span className="rd-field-label">Recordings</span>
                <span className="rd-field-value">{mockRecordings.length} sessions</span>
              </div>
              <div className="rd-field">
                <span className="rd-field-label">Home Visits</span>
                <span className="rd-field-value">{mockVisits.length} visits</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
