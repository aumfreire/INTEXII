import { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
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
  MapPin,
  ArrowRightLeft,
  Trash2,
  ExternalLink,
  PencilLine,
} from 'lucide-react';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import AlertBanner from '../components/ui/AlertBanner';
import { useAuth } from '../context/useAuth';
import {
  getAdminResidentDetail,
  deleteAdminProcessRecording,
  deleteAdminHomeVisitation,
  deleteAdminInterventionPlan,
} from '../lib/authAPI';
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
  notesRestricted: null as string | null,
};

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

/* ===== Helpers ===== */
const riskLabels: Record<RiskLevel, string> = { low: 'Low', moderate: 'Moderate', high: 'High', critical: 'Critical' };
const statusLabels: Record<CaseStatus, string> = { active: 'Active', intake: 'Intake', reintegration: 'Reintegration', closed: 'Closed' };

function hasMeaningfulText(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 && normalized !== 'n/a' && normalized !== 'not assigned' && normalized !== 'unassigned';
}

function formatDate(iso: string): string {
  if (!iso) {
    return 'N/A';
  }

  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalizeCaseStatus(value: string): CaseStatus {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'intake' || normalized === 'reintegration' || normalized === 'closed') {
    return normalized;
  }

  return 'active';
}

function normalizeRiskLevel(value: string): RiskLevel {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'low' || normalized === 'moderate' || normalized === 'high' || normalized === 'critical') {
    return normalized;
  }

  return 'moderate';
}

function calculateAge(dateOfBirth: string | null | undefined): number | null {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 0 || age > 120) {
    return null;
  }

  return age;
}

/* ===== Component ===== */
export default function ResidentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authSession } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'recording' | 'visit' | 'conference'; itemId: number } | null>(null);
  const [actionError, setActionError] = useState('');
  const [resident, setResident] = useState(mockResident);
  const [recordings, setRecordings] = useState(mockRecordings);
  const [visits, setVisits] = useState(mockVisits);
  const [conferences, setConferences] = useState(mockConferences);
  const [interventions, setInterventions] = useState(mockInterventions);
  const [expandedRecording, setExpandedRecording] = useState<string | null>(null);
  const [expandedVisit, setExpandedVisit] = useState<string | null>(null);
  const isAdmin = authSession.roles.includes('Admin');

  useEffect(() => {
    let isMounted = true;

    async function loadResidentDetail() {
      if (!id) {
        setHasError(true);
        setIsLoading(false);
        return;
      }

      setHasError(false);
      setIsLoading(true);

      try {
        const detail = await getAdminResidentDetail(id);
        if (!isMounted) return;

        setResident({
          id: String(detail.id),
          name: detail.name,
          initials: detail.initials || 'R',
          code: detail.code,
          caseControlNumber: detail.caseControlNumber ?? `CCN-${detail.id}`,
          safehouse: detail.safehouse,
          caseStatus: normalizeCaseStatus(detail.caseStatus),
          riskLevel: normalizeRiskLevel(detail.riskLevel),
          assignedWorker: detail.assignedWorker ?? 'Unassigned',
          caseCategory: detail.caseCategory,
          caseSubCategory: detail.caseSubCategory ?? 'N/A',
          admissionDate: detail.admissionDate ?? '',
          dateOfBirth: detail.dateOfBirth ?? '',
          age: detail.age ?? 0,
          gender: detail.gender ?? 'N/A',
          nationality: detail.nationality ?? 'N/A',
          education: detail.education ?? 'N/A',
          referralSource: detail.referralSource ?? 'N/A',
          referralDate: detail.referralDate ?? '',
          referralOfficer: detail.referralOfficer ?? 'N/A',
          familyStatus: detail.familyStatus ?? 'N/A',
          siblings: detail.siblings ?? 'N/A',
          familyContact: detail.familyContact ?? 'N/A',
          reintegrationStatus: detail.reintegrationStatus,
          reintegrationType: detail.reintegrationType ?? 'Not assigned',
          notesRestricted: detail.notesRestricted ?? null,
        });

        setRecordings(
          detail.recordings.map((item) => ({
            id: String(item.id),
            date: item.date ?? '',
            worker: item.worker ?? 'Unassigned',
            sessionType: item.sessionType ?? 'Session',
            emotionStart: item.emotionStart ?? 'N/A',
            emotionEnd: item.emotionEnd ?? 'N/A',
            progressNoted: item.progressNoted,
            concernFlagged: item.concernFlagged,
            referralMade: item.referralMade,
            summary: item.summary,
          }))
        );

        setVisits(
          detail.visits.map((item) => ({
            id: String(item.id),
            date: item.date ?? '',
            type: item.type ?? 'Visit',
            worker: item.worker ?? 'Unassigned',
            cooperation: item.cooperation ?? 'Neutral',
            safetyConcern: item.safetyConcern,
            followUpNeeded: item.followUpNeeded,
            notes: item.notes,
          }))
        );

        setConferences(
          detail.conferences.map((item) => ({
            id: String(item.id),
            date: item.date ?? '',
            upcoming: item.upcoming,
            attendees: item.attendees ?? 'Unspecified attendees',
            notes: item.notes ?? '',
          }))
        );

        const mappedInterventions = detail.reintegrationInterventions
          .map((item) => item.description || item.services || item.category || '')
          .filter((item) => item.length > 0);

        if (mappedInterventions.length > 0) {
          setInterventions(mappedInterventions);
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

    void loadResidentDetail();

    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleDelete() {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === 'recording') {
        await deleteAdminProcessRecording(confirmDelete.itemId);
        setRecordings((prev) => prev.filter((r) => r.id !== String(confirmDelete.itemId)));
      } else if (confirmDelete.type === 'visit') {
        await deleteAdminHomeVisitation(confirmDelete.itemId);
        setVisits((prev) => prev.filter((v) => v.id !== String(confirmDelete.itemId)));
      } else if (confirmDelete.type === 'conference') {
        await deleteAdminInterventionPlan(confirmDelete.itemId);
        setConferences((prev) => prev.filter((c) => c.id !== String(confirmDelete.itemId)));
      }
      setConfirmDelete(null);
    } catch {
      setActionError('Failed to delete. Please try again.');
      setConfirmDelete(null);
    }
  }

  const r = resident;
  const displayAge = calculateAge(r.dateOfBirth) ?? (typeof r.age === 'number' && r.age > 0 && r.age <= 120 ? r.age : null);
  const interventionText = interventions.join(' ').toLowerCase();
  const conferenceText = conferences.map((c) => c.notes).join(' ').toLowerCase();

  const reintegrationMilestones = [
    {
      text: 'Intake assessment completed',
      done: hasMeaningfulText(r.referralSource) || hasMeaningfulText(r.referralOfficer) || hasMeaningfulText(r.admissionDate),
    },
    {
      text: 'Case plan established',
      done: interventions.length > 0 || conferences.length > 0,
    },
    {
      text: 'Education enrollment confirmed',
      done: hasMeaningfulText(r.education) && !r.education.toLowerCase().includes('not started'),
    },
    {
      text: 'Initial trauma assessment',
      done: recordings.length > 0 || interventionText.includes('trauma'),
    },
    {
      text: 'Family contact initiated',
      done: hasMeaningfulText(r.familyContact),
    },
    {
      text: 'Home safety assessment',
      done: visits.length > 0,
    },
    {
      text: 'Family mediation sessions',
      done: interventionText.includes('mediation') || conferenceText.includes('mediation'),
    },
    {
      text: 'Community reintegration plan',
      done: hasMeaningfulText(r.reintegrationType) || interventions.length > 0,
    },
    {
      text: 'Post-reintegration follow-up schedule',
      done: conferences.some((c) => c.upcoming) || visits.some((v) => v.followUpNeeded),
    },
  ];

  const derivedBlockers: { text: string; date: string }[] = [];

  const safetyConcernVisit = visits.find((v) => v.safetyConcern);
  if (safetyConcernVisit) {
    derivedBlockers.push({
      text: 'Safety concern flagged in home visit — review needed before next reintegration step.',
      date: `Visit ${formatDate(safetyConcernVisit.date)}`,
    });
  }

  const clinicalConcernRecording = recordings.find((rec) => rec.concernFlagged || rec.referralMade);
  if (clinicalConcernRecording) {
    derivedBlockers.push({
      text: clinicalConcernRecording.referralMade
        ? 'Clinical referral is open and should be tracked before transition decisions.'
        : 'Counseling concerns are flagged and need follow-up actions.',
      date: `Recording ${formatDate(clinicalConcernRecording.date)}`,
    });
  }

  if (!hasMeaningfulText(r.familyContact)) {
    derivedBlockers.push({
      text: 'Family contact has not been established yet.',
      date: 'Pending',
    });
  }

  if (!conferences.some((c) => c.upcoming)) {
    derivedBlockers.push({
      text: 'No upcoming case conference scheduled to review reintegration progress.',
      date: 'Schedule needed',
    });
  }

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

  const confirmDeleteLabel =
    confirmDelete?.type === 'recording' ? 'process recording' :
      confirmDelete?.type === 'visit' ? 'home visit' :
        'case conference';

  return (
    <div>
      {/* Back link */}
      <Link to="/admin/caseload" className="rd-back">
        <ArrowLeft size={16} /> Back to Caseload
      </Link>

      {actionError && (
        <AlertBanner type="warning" message={actionError} onClose={() => setActionError('')} />
      )}

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
            <SecondaryButton onClick={() => navigate(`/admin/caseload?editResidentId=${id ?? ''}&returnTo=${encodeURIComponent(`/admin/residents/${id ?? ''}`)}`)}>
              <PencilLine size={15} /> Edit Resident Record
            </SecondaryButton>
            <SecondaryButton onClick={() => navigate(`/admin/process-recordings?residentId=${id ?? ''}`)}>
              <FileText size={15} /> Add Recording
            </SecondaryButton>
            <PrimaryButton onClick={() => navigate(`/admin/home-visits?residentId=${id ?? ''}`)}>
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
                    <span className="rd-field-value">{formatDate(r.dateOfBirth)} {displayAge !== null ? `(Age ${displayAge})` : '(Age N/A)'}</span>
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

              {isAdmin && hasMeaningfulText(r.notesRestricted) && (
                <div className="rd-panel">
                  <h3 className="rd-panel-title">Restricted Notes</h3>
                  <div className="rd-restricted" style={{ marginTop: '16px' }}>
                    <Lock size={20} className="rd-restricted-icon" />
                    <div className="rd-restricted-text" style={{ whiteSpace: 'pre-wrap' }}>
                      {r.notesRestricted}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ===== PROCESS RECORDINGS TAB ===== */}
          {activeTab === 'recordings' && (
            <div className="rd-panel">
              <div className="rd-panel-header">
                <h3 className="rd-panel-title">Process Recordings</h3>
                <PrimaryButton onClick={() => navigate(`/admin/process-recordings?residentId=${id ?? ''}`)}>
                  <FileText size={15} /> Add Recording
                </PrimaryButton>
              </div>
              {recordings.length === 0 ? (
                <div className="rd-empty">
                  <Inbox size={40} className="rd-empty-icon" />
                  <h4 className="rd-empty-title">No process recordings yet</h4>
                  <p className="rd-empty-text">Document your first session to begin tracking progress.</p>
                </div>
              ) : (
                <div className="rd-timeline">
                  {recordings.map((rec) => {
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
                            <div className="rd-card-actions">
                              <button
                                className="rd-card-action-btn"
                                title="Edit in Process Recordings"
                                onClick={() => navigate(`/admin/process-recordings?residentId=${id ?? ''}`)}
                              >
                                <ExternalLink size={13} />
                              </button>
                              <button
                                className="rd-card-action-btn danger"
                                title="Delete recording"
                                onClick={() => setConfirmDelete({ type: 'recording', itemId: Number(rec.id) })}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
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
                <PrimaryButton onClick={() => navigate(`/admin/home-visits?residentId=${id ?? ''}`)}>
                  <Home size={15} /> Log Home Visit
                </PrimaryButton>
              </div>
              {visits.length === 0 ? (
                <div className="rd-empty">
                  <Inbox size={40} className="rd-empty-icon" />
                  <h4 className="rd-empty-title">No home visits recorded</h4>
                  <p className="rd-empty-text">Log a visit to begin documenting home assessments.</p>
                </div>
              ) : (
                <div className="rd-timeline">
                  {visits.map((v) => {
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
                            <div className="rd-card-actions">
                              <button
                                className="rd-card-action-btn"
                                title="Edit in Home Visits"
                                onClick={() => navigate(`/admin/home-visits?residentId=${id ?? ''}`)}
                              >
                                <ExternalLink size={13} />
                              </button>
                              <button
                                className="rd-card-action-btn danger"
                                title="Delete visit"
                                onClick={() => setConfirmDelete({ type: 'visit', itemId: Number(v.id) })}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
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
                <div className="rd-panel-header">
                  <h3 className="rd-panel-title">Upcoming Conferences</h3>
                  <PrimaryButton onClick={() => navigate(`/admin/home-visits?residentId=${id ?? ''}`)}>
                    <Calendar size={15} /> Schedule Conference
                  </PrimaryButton>
                </div>
                <div style={{ marginTop: '16px' }}>
                  {conferences.filter((c) => c.upcoming).length === 0 && (
                    <div className="rd-empty" style={{ padding: '20px' }}>
                      <p className="rd-empty-text" style={{ margin: 0 }}>No upcoming conferences scheduled.</p>
                    </div>
                  )}
                  {conferences.filter((c) => c.upcoming).map((c) => (
                    <div className="rd-conference-card" key={c.id}>
                      <div className="rd-conference-date" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          {formatDate(c.date)}
                          <span className="rd-upcoming-badge" style={{ marginLeft: '8px' }}>
                            <Calendar size={11} /> Upcoming
                          </span>
                        </span>
                        <button
                          className="rd-card-action-btn danger"
                          title="Delete conference"
                          onClick={() => setConfirmDelete({ type: 'conference', itemId: Number(c.id) })}
                        >
                          <Trash2 size={13} />
                        </button>
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
                  {conferences.filter((c) => !c.upcoming).map((c) => (
                    <div className="rd-conference-card" key={c.id}>
                      <div className="rd-conference-date" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>{formatDate(c.date)}</span>
                        <button
                          className="rd-card-action-btn danger"
                          title="Delete conference"
                          onClick={() => setConfirmDelete({ type: 'conference', itemId: Number(c.id) })}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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
                  {interventions.map((item, i) => (
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
                    {reintegrationMilestones.filter((m) => m.done).length} of {reintegrationMilestones.length} milestones
                  </div>
                </div>
              </div>

              {/* Milestones */}
              <div className="rd-panel">
                <h3 className="rd-panel-title">Milestones</h3>
                <ul className="rd-checklist" style={{ marginTop: '16px' }}>
                  {reintegrationMilestones.map((m, i) => (
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
                {derivedBlockers.length === 0 ? (
                  <div className="rd-empty" style={{ padding: '24px' }}>
                    <p className="rd-empty-text" style={{ margin: 0 }}>No current blockers. Keep up the great work.</p>
                  </div>
                ) : (
                  <div style={{ marginTop: '16px' }}>
                    {derivedBlockers.map((b, i) => (
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

              {/* Milestone Guide */}
              <div className="rd-panel rd-reference-panel">
                <h3 className="rd-panel-title rd-reference-title">How Milestones Are Met</h3>
                <p className="rd-reference-text">
                  These milestones update automatically from the resident&apos;s records. This guide is only a reference for what data needs to be added or updated.
                </p>
                <ul className="rd-reference-list">
                  <li><strong>Intake assessment completed:</strong> add a referral source, referral officer, or admission date.</li>
                  <li><strong>Case plan established:</strong> create an intervention plan or schedule a case conference.</li>
                  <li><strong>Education enrollment confirmed:</strong> enter education details that do not say “not started”.</li>
                  <li><strong>Initial trauma assessment:</strong> add a process recording, especially one that mentions trauma or counseling concerns.</li>
                  <li><strong>Family contact initiated:</strong> fill in the primary family contact field.</li>
                  <li><strong>Home safety assessment:</strong> log at least one home visit.</li>
                  <li><strong>Family mediation sessions:</strong> note mediation in an intervention plan or conference note.</li>
                  <li><strong>Community reintegration plan:</strong> add a reintegration type or an intervention plan.</li>
                  <li><strong>Post-reintegration follow-up schedule:</strong> schedule an upcoming conference or mark a visit for follow-up.</li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* ===== Sidebar ===== */}
        <div className="rd-sidebar">
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
                <span className="rd-field-value">{displayAge !== null ? `${displayAge} years old` : 'Age N/A'}</span>
              </div>
              <div className="rd-field">
                <span className="rd-field-label">Recordings</span>
                <span className="rd-field-value">{recordings.length} sessions</span>
              </div>
              <div className="rd-field">
                <span className="rd-field-label">Home Visits</span>
                <span className="rd-field-value">{visits.length} visits</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <div className="confirm-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <h4 className="confirm-title">Delete {confirmDeleteLabel}?</h4>
            <p className="confirm-text">
              This action cannot be undone. The {confirmDeleteLabel} will be permanently removed from this resident's record.
            </p>
            <div className="confirm-actions">
              <button className="confirm-btn cancel" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="confirm-btn danger" onClick={() => void handleDelete()}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
