import { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Home,
  Calendar,
  MoreVertical,
  PencilLine,
  Trash2,
  X,
  Plus,
  Inbox,
  RefreshCw,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import AlertBanner from '../components/ui/AlertBanner';
import {
  getAdminHomeVisitations,
  createAdminHomeVisitation,
  updateAdminHomeVisitation,
  deleteAdminHomeVisitation,
  getAdminInterventionPlans,
  createAdminInterventionPlan,
  updateAdminInterventionPlan,
  deleteAdminInterventionPlan,
  getAdminResidentOptions,
  type HomeVisitationListItem,
  type HomeVisitationUpsertRequest,
  type InterventionPlanItem,
  type InterventionPlanUpsertRequest,
  type ResidentOption,
} from '../lib/authAPI';
import '../styles/pages/home-visits.css';

/* ===== Label Maps ===== */
const visitTypeLabels: Record<string, string> = {
  'initial-assessment': 'Initial Assessment',
  'routine-follow-up': 'Routine Follow-Up',
  'reintegration-assessment': 'Reintegration Assessment',
  'post-placement': 'Post-Placement Monitoring',
  emergency: 'Emergency',
};

const cooperationLabels: Record<string, string> = {
  cooperative: 'Cooperative',
  neutral: 'Neutral',
  resistant: 'Resistant',
  unavailable: 'Unavailable',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isUpcomingConference(plan: InterventionPlanItem): boolean {
  if (typeof plan.status === 'string' && plan.status.trim().toLowerCase() === 'upcoming') {
    return true;
  }

  if (!plan.caseConferenceDate) {
    return false;
  }

  const conferenceDate = new Date(`${plan.caseConferenceDate}T00:00:00`);
  if (Number.isNaN(conferenceDate.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return conferenceDate >= today;
}

/* ===== Action Menu ===== */
function ActionMenu({ id, onEdit, onDelete }: { id: number; onEdit: (id: number) => void; onDelete: (id: number) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);
  return (
    <div className="hv-actions" ref={ref}>
      <button className="hv-actions-btn" onClick={() => setOpen(!open)} aria-label="Actions"><MoreVertical size={16} /></button>
      {open && (
        <div className="hv-actions-menu">
          <button className="hv-actions-menu-item" onClick={() => { setOpen(false); onEdit(id); }}><PencilLine size={14} /> Edit</button>
          <button className="hv-actions-menu-item danger" onClick={() => { setOpen(false); onDelete(id); }}><Trash2 size={14} /> Delete</button>
        </div>
      )}
    </div>
  );
}

function ConfirmDialog({ message, onConfirm, onCancel }: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-md)', padding: '28px 32px', maxWidth: '420px', width: '90%', boxShadow: 'var(--shadow-lg)' }}>
        <p style={{ margin: '0 0 20px', fontSize: '0.95rem', color: 'var(--color-dark)', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
          <button onClick={onConfirm} style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: 'none', backgroundColor: '#c0392b', color: '#fff', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ===== Home Visits Tab ===== */
interface VisitForm {
  residentId: string;
  visitDate: string;
  socialWorker: string;
  visitType: string;
  locationVisited: string;
  purpose: string;
  observations: string;
  familyCooperationLevel: string;
  safetyConcernsNoted: boolean;
  followUpNeeded: boolean;
  followUpNotes: string;
  visitOutcome: string;
}

const emptyVisitForm: VisitForm = {
  residentId: '', visitDate: '', socialWorker: '', visitType: 'routine-follow-up',
  locationVisited: '', purpose: '', observations: '',
  familyCooperationLevel: 'cooperative', safetyConcernsNoted: false,
  followUpNeeded: false, followUpNotes: '', visitOutcome: '',
};

function HomeVisitsTab({ residents, prefilledResidentId }: { residents: ResidentOption[]; prefilledResidentId: string }) {
  const pageSizeOptions = [10, 25, 50, 100];
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [visits, setVisits] = useState<HomeVisitationListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [search, setSearch] = useState('');
  const [filterResidentId, setFilterResidentId] = useState(prefilledResidentId);
  const [filterVisitType, setFilterVisitType] = useState('');
  const [filterSafety, setFilterSafety] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorId, setEditorId] = useState<number | null>(null);
  const [editorForm, setEditorForm] = useState<VisitForm>(emptyVisitForm);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => { void loadVisits(); }, [page, pageSize, filterResidentId, filterVisitType, filterSafety]);  // eslint-disable-line

  async function loadVisits() {
    setIsLoading(true);
    try {
      const result = await getAdminHomeVisitations({
        residentId: filterResidentId ? Number(filterResidentId) : undefined,
        visitType: filterVisitType || undefined,
        safetyConcern: filterSafety === 'yes' ? true : filterSafety === 'no' ? false : undefined,
        search: search || undefined,
        page,
        pageSize,
      });
      setVisits(result.items);
      setTotal(result.total);
    } catch { setErrorMessage('Unable to load home visits.'); }
    finally { setIsLoading(false); }
  }

  function openCreate() {
    setEditorId(null);
    setEditorForm({ ...emptyVisitForm, residentId: filterResidentId });
    setEditorOpen(true);
  }

  function openEdit(id: number) {
    const v = visits.find((x) => x.id === id);
    if (!v) return;
    setEditorId(id);
    setEditorForm({
      residentId: v.residentId ? String(v.residentId) : '',
      visitDate: v.visitDate ?? '',
      socialWorker: v.socialWorker ?? '',
      visitType: v.visitType ?? 'routine-follow-up',
      locationVisited: '',
      purpose: '',
      observations: '',
      familyCooperationLevel: 'cooperative',
      safetyConcernsNoted: v.safetyConcernsNoted,
      followUpNeeded: v.followUpNeeded,
      followUpNotes: '',
      visitOutcome: v.visitOutcome ?? '',
    });
    setEditorOpen(true);
  }

  async function handleSave() {
    if (!editorForm.visitDate) { setErrorMessage('Visit date is required.'); return; }
    setIsSaving(true);
    try {
      const payload: HomeVisitationUpsertRequest = {
        residentId: editorForm.residentId ? Number(editorForm.residentId) : null,
        visitDate: editorForm.visitDate || null,
        socialWorker: editorForm.socialWorker || null,
        visitType: editorForm.visitType || null,
        locationVisited: editorForm.locationVisited || null,
        purpose: editorForm.purpose || null,
        observations: editorForm.observations || null,
        familyCooperationLevel: editorForm.familyCooperationLevel || null,
        safetyConcernsNoted: editorForm.safetyConcernsNoted,
        followUpNeeded: editorForm.followUpNeeded,
        followUpNotes: editorForm.followUpNotes || null,
        visitOutcome: editorForm.visitOutcome || null,
      };
      if (editorId) { await updateAdminHomeVisitation(editorId, payload); }
      else { await createAdminHomeVisitation(payload); }
      setEditorOpen(false);
      setEditorId(null);
      setEditorForm(emptyVisitForm);
      void loadVisits();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to save visit.');
    } finally { setIsSaving(false); }
  }

  async function handleDelete() {
    if (!confirmDeleteId) return;
    try {
      await deleteAdminHomeVisitation(confirmDeleteId);
      setConfirmDeleteId(null);
      void loadVisits();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to delete visit.');
      setConfirmDeleteId(null);
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <>
      {errorMessage && <AlertBanner type="warning" message={errorMessage} onClose={() => setErrorMessage('')} />}

      <div className="hv-toolbar">
        <div className="hv-filters">
          <div className="hv-filter-group">
            <label className="hv-filter-label">Search</label>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
              <input className="hv-filter-input" placeholder="Worker, purpose..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && void loadVisits()} style={{ paddingLeft: '34px' }} />
            </div>
          </div>
          <div className="hv-filter-group">
            <label className="hv-filter-label">Resident</label>
            <select className="hv-filter-select" value={filterResidentId} onChange={(e) => { setFilterResidentId(e.target.value); setPage(1); }}>
              <option value="">All Residents</option>
              {residents.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
            </select>
          </div>
          <div className="hv-filter-group">
            <label className="hv-filter-label">Visit Type</label>
            <select className="hv-filter-select" value={filterVisitType} onChange={(e) => { setFilterVisitType(e.target.value); setPage(1); }}>
              <option value="">All Types</option>
              {Object.entries(visitTypeLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
          </div>
          <div className="hv-filter-group">
            <label className="hv-filter-label">Safety Concern</label>
            <select className="hv-filter-select" value={filterSafety} onChange={(e) => { setFilterSafety(e.target.value); setPage(1); }}>
              <option value="">Any</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div className="hv-filter-group">
            <label className="hv-filter-label">Display</label>
            <select
              className="hv-filter-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
          <button className="hv-search-btn" onClick={() => void loadVisits()}>Search</button>
        </div>
        <PrimaryButton onClick={openCreate}><Plus size={15} /> Log Visit</PrimaryButton>
      </div>

      <div className="hv-table-wrap">
        {isLoading ? (
          <div className="hv-state">{[1, 2, 3].map((i) => <div key={i} className="hv-skeleton-row"><div className="hv-skeleton-bar" style={{ width: '100px' }} /><div className="hv-skeleton-bar" style={{ width: '140px' }} /><div className="hv-skeleton-bar" style={{ flex: 1 }} /></div>)}</div>
        ) : visits.length === 0 ? (
          <div className="hv-state">
            <div className="hv-state-icon"><Inbox size={44} /></div>
            <h3 className="hv-state-title">No home visits logged</h3>
            <p className="hv-state-text">No home visits match your current filters.</p>
            <button className="hv-clear-btn" onClick={() => { setSearch(''); setFilterResidentId(''); setFilterVisitType(''); setFilterSafety(''); setPage(1); void loadVisits(); }}><RefreshCw size={14} /> Clear Filters</button>
          </div>
        ) : (
          <>
            <div className="hv-table-scroll">
              <table className="hv-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Resident</th>
                    <th>Social Worker</th>
                    <th>Type</th>
                    <th>Cooperation</th>
                    <th>Flags</th>
                    <th style={{ width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((v) => (
                    <tr key={v.id}>
                      <td className="hv-date">{formatDate(v.visitDate)}</td>
                      <td>
                        {v.residentId ? (
                          <Link to={`/admin/residents/${v.residentId}`} className="hv-resident-link" style={{ textDecoration: 'none' }}>
                            <div className="hv-resident-name">{v.residentName}</div>
                          </Link>
                        ) : (
                          <div className="hv-resident-name">{v.residentName}</div>
                        )}
                      </td>
                      <td className="hv-worker">{v.socialWorker ?? '—'}</td>
                      <td><span className="hv-badge type">{visitTypeLabels[v.visitType ?? ''] ?? v.visitType ?? '—'}</span></td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>—</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {v.safetyConcernsNoted && <span className="hv-flag danger" title="Safety Concern"><AlertTriangle size={13} /></span>}
                          {v.followUpNeeded && <span className="hv-flag followup" title="Follow-Up Needed"><Clock size={13} /></span>}
                        </div>
                      </td>
                      <td><ActionMenu id={v.id} onEdit={openEdit} onDelete={(id) => setConfirmDeleteId(id)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="hv-table-footer">
              <span>{((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}</span>
              <div className="hv-pagination">
                <button className="hv-page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</button>
                <span>Page {page} of {totalPages || 1}</span>
                <button className="hv-page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next ›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Editor Panel */}
      {editorOpen && (
        <div className="hv-modal-overlay" onClick={() => { setEditorOpen(false); setEditorId(null); setEditorForm(emptyVisitForm); }}>
          <div id="hv-editor" className="hv-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="hv-modal-header">
              <h3 className="hv-modal-title"><Home size={16} style={{ display: 'inline', marginRight: '8px', color: 'var(--color-primary)' }} />{editorId ? 'Edit Home Visit' : 'Log Home Visit'}</h3>
              <button className="hv-modal-close" onClick={() => { setEditorOpen(false); setEditorId(null); setEditorForm(emptyVisitForm); }} aria-label="Close"><X size={20} /></button>
            </div>
            <div className="hv-modal-body">
              {errorMessage ? (
                <AlertBanner type="warning" message={errorMessage} onClose={() => setErrorMessage('')} />
              ) : null}
              <div className="hv-editor-grid">
                <div className="hv-editor-column">
                  <label className="hv-filter-label">Resident</label>
                  <select className="hv-filter-select" value={editorForm.residentId} onChange={(e) => setEditorForm({ ...editorForm, residentId: e.target.value })}>
                    <option value="">— Select Resident —</option>
                    {residents.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
                  </select>
                  <label className="hv-filter-label">Visit Date *</label>
                  <input type="date" className="hv-filter-input" value={editorForm.visitDate} onChange={(e) => setEditorForm({ ...editorForm, visitDate: e.target.value })} />
                  <label className="hv-filter-label">Social Worker</label>
                  <input className="hv-filter-input" value={editorForm.socialWorker} onChange={(e) => setEditorForm({ ...editorForm, socialWorker: e.target.value })} placeholder="Social worker name" />
                  <label className="hv-filter-label">Visit Type</label>
                  <select className="hv-filter-select" value={editorForm.visitType} onChange={(e) => setEditorForm({ ...editorForm, visitType: e.target.value })}>
                    {Object.entries(visitTypeLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                  <label className="hv-filter-label">Location Visited</label>
                  <input className="hv-filter-input" value={editorForm.locationVisited} onChange={(e) => setEditorForm({ ...editorForm, locationVisited: e.target.value })} placeholder="Address or area" />
                  <label className="hv-filter-label">Family Cooperation</label>
                  <select className="hv-filter-select" value={editorForm.familyCooperationLevel} onChange={(e) => setEditorForm({ ...editorForm, familyCooperationLevel: e.target.value })}>
                    {Object.entries(cooperationLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </div>
                <div className="hv-editor-column">
                  <label className="hv-filter-label">Purpose</label>
                  <textarea className="hv-filter-textarea" rows={2} value={editorForm.purpose} onChange={(e) => setEditorForm({ ...editorForm, purpose: e.target.value })} placeholder="Purpose of visit..." />
                  <label className="hv-filter-label">Observations</label>
                  <textarea className="hv-filter-textarea" rows={4} value={editorForm.observations} onChange={(e) => setEditorForm({ ...editorForm, observations: e.target.value })} placeholder="What was observed during the visit..." />
                  <label className="hv-filter-label">Visit Outcome</label>
                  <input className="hv-filter-input" value={editorForm.visitOutcome} onChange={(e) => setEditorForm({ ...editorForm, visitOutcome: e.target.value })} placeholder="Summary outcome" />
                  <div className="hv-flags-form">
                    <label className="hv-check-label"><input type="checkbox" checked={editorForm.safetyConcernsNoted} onChange={(e) => setEditorForm({ ...editorForm, safetyConcernsNoted: e.target.checked })} style={{ accentColor: '#c0392b' }} /><AlertTriangle size={14} style={{ color: '#c0392b' }} /> Safety Concerns Noted</label>
                    <label className="hv-check-label"><input type="checkbox" checked={editorForm.followUpNeeded} onChange={(e) => setEditorForm({ ...editorForm, followUpNeeded: e.target.checked })} style={{ accentColor: '#e67e22' }} /><Clock size={14} style={{ color: '#e67e22' }} /> Follow-Up Needed</label>
                  </div>
                  {editorForm.followUpNeeded && (
                    <>
                      <label className="hv-filter-label">Follow-Up Notes</label>
                      <textarea className="hv-filter-textarea" rows={2} value={editorForm.followUpNotes} onChange={(e) => setEditorForm({ ...editorForm, followUpNotes: e.target.value })} placeholder="Describe follow-up actions..." />
                    </>
                  )}
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <SecondaryButton onClick={() => { setEditorOpen(false); setEditorId(null); setEditorForm(emptyVisitForm); }}>Cancel</SecondaryButton>
                <PrimaryButton onClick={() => { void handleSave(); }} disabled={isSaving}>{isSaving ? 'Saving...' : editorId ? 'Update Visit' : 'Save Visit'}</PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId !== null && <ConfirmDialog message="Delete this home visit record?" onConfirm={() => { void handleDelete(); }} onCancel={() => setConfirmDeleteId(null)} />}
    </>
  );
}

/* ===== Case Conferences Tab ===== */
interface ConferenceForm {
  residentId: string;
  caseConferenceDate: string;
  servicesProvided: string;
  planDescription: string;
  planCategory: string;
  status: string;
}

const emptyConferenceForm: ConferenceForm = {
  residentId: '', caseConferenceDate: '', servicesProvided: '', planDescription: '', planCategory: '', status: 'upcoming',
};

function CaseConferencesTab({ residents }: { residents: ResidentOption[] }) {
  const pageSizeOptions = [10, 25, 50, 100];
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [plans, setPlans] = useState<InterventionPlanItem[]>([]);
  const [filterResidentId, setFilterResidentId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorId, setEditorId] = useState<number | null>(null);
  const [editorForm, setEditorForm] = useState<ConferenceForm>(emptyConferenceForm);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => { void loadPlans(); }, [filterResidentId, filterStatus]); // eslint-disable-line

  const visiblePlans = useMemo(() => {
    if (filterStatus === 'upcoming') {
      return plans.filter((plan) => isUpcomingConference(plan));
    }

    if (filterStatus === 'completed') {
      return plans.filter((plan) => !isUpcomingConference(plan));
    }

    return plans;
  }, [filterStatus, plans]);

  const totalPages = Math.max(1, Math.ceil(visiblePlans.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pagedPlans = visiblePlans.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [filterResidentId, filterStatus]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  async function loadPlans() {
    setIsLoading(true);
    try {
      const data = await getAdminInterventionPlans({
        residentId: filterResidentId ? Number(filterResidentId) : undefined,
        hasConference: true,
      });
      setPlans(data);
    } catch { setErrorMessage('Unable to load case conferences.'); }
    finally { setIsLoading(false); }
  }

  function openCreate() {
    setEditorId(null);
    setEditorForm(emptyConferenceForm);
    setEditorOpen(true);
  }

  function openEdit(id: number) {
    const p = plans.find((x) => x.id === id);
    if (!p) return;
    setEditorId(id);
    setEditorForm({
      residentId: p.residentId ? String(p.residentId) : '',
      caseConferenceDate: p.caseConferenceDate ?? '',
      servicesProvided: p.servicesProvided ?? '',
      planDescription: p.planDescription ?? '',
      planCategory: p.planCategory ?? '',
      status: p.status ?? 'upcoming',
    });
    setEditorOpen(true);
  }

  async function handleSave() {
    if (!editorForm.caseConferenceDate) { setErrorMessage('Conference date is required.'); return; }
    setIsSaving(true);
    try {
      const payload: InterventionPlanUpsertRequest = {
        residentId: editorForm.residentId ? Number(editorForm.residentId) : null,
        planCategory: editorForm.planCategory || null,
        planDescription: editorForm.planDescription || null,
        servicesProvided: editorForm.servicesProvided || null,
        caseConferenceDate: editorForm.caseConferenceDate || null,
        status: editorForm.status,
      };
      if (editorId) { await updateAdminInterventionPlan(editorId, payload); }
      else { await createAdminInterventionPlan(payload); }
      setEditorOpen(false);
      void loadPlans();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to save conference.');
    } finally { setIsSaving(false); }
  }

  async function handleDelete() {
    if (!confirmDeleteId) return;
    try {
      await deleteAdminInterventionPlan(confirmDeleteId);
      setConfirmDeleteId(null);
      void loadPlans();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to delete conference.');
      setConfirmDeleteId(null);
    }
  }

  return (
    <>
      {errorMessage && <AlertBanner type="warning" message={errorMessage} onClose={() => setErrorMessage('')} />}

      <div className="hv-toolbar">
        <div className="hv-filters">
          <div className="hv-filter-group">
            <label className="hv-filter-label">Resident</label>
            <select className="hv-filter-select" value={filterResidentId} onChange={(e) => setFilterResidentId(e.target.value)}>
              <option value="">All Residents</option>
              {residents.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
            </select>
          </div>
          <div className="hv-filter-group">
            <label className="hv-filter-label">Status</label>
            <select className="hv-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="hv-filter-group">
            <label className="hv-filter-label">Display</label>
            <select
              className="hv-filter-select"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
            >
              {pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </div>
        </div>
        <PrimaryButton onClick={openCreate}><Plus size={15} /> Schedule Conference</PrimaryButton>
      </div>

      <div className="hv-table-wrap">
        {isLoading ? (
          <div className="hv-state">{[1, 2, 3].map((i) => <div key={i} className="hv-skeleton-row"><div className="hv-skeleton-bar" style={{ width: '100px' }} /><div className="hv-skeleton-bar" style={{ flex: 1 }} /></div>)}</div>
        ) : visiblePlans.length === 0 ? (
          <div className="hv-state">
            <div className="hv-state-icon"><Inbox size={44} /></div>
            <h3 className="hv-state-title">No case conferences found</h3>
            <p className="hv-state-text">No case conferences match your filters.</p>
          </div>
        ) : (
          <div className="hv-table-scroll">
            <table className="hv-table">
              <thead>
                <tr>
                  <th>Conference Date</th>
                  <th>Resident</th>
                  <th>Category</th>
                  <th>Services Discussed</th>
                  <th>Status</th>
                  <th style={{ width: '60px' }}></th>
                </tr>
              </thead>
              <tbody>
                {pagedPlans.map((p) => (
                  <tr key={p.id}>
                    <td className="hv-date">{formatDate(p.caseConferenceDate)}</td>
                    <td>
                      {p.residentId ? (
                        <Link to={`/admin/residents/${p.residentId}`} className="hv-resident-link" style={{ textDecoration: 'none' }}>
                          <div className="hv-resident-name">{p.residentName ?? '—'}</div>
                        </Link>
                      ) : (
                        <div className="hv-resident-name">{p.residentName ?? '—'}</div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-muted)' }}>{p.planCategory ?? '—'}</td>
                    <td style={{ fontSize: '0.85rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.servicesProvided ?? '—'}</td>
                    <td>
                      <span className={`hv-badge ${isUpcomingConference(p) ? 'upcoming' : 'completed'}`}>
                        {isUpcomingConference(p) ? 'Upcoming' : 'Completed'}
                      </span>
                    </td>
                    <td><ActionMenu id={p.id} onEdit={openEdit} onDelete={(id) => setConfirmDeleteId(id)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="hv-table-footer">
              <span>{visiblePlans.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, visiblePlans.length)} of {visiblePlans.length}</span>
              <div className="hv-pagination">
                <button className="hv-page-btn" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>‹ Prev</button>
                <span>Page {currentPage} of {totalPages}</span>
                <button className="hv-page-btn" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Next ›</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor Panel */}
      {editorOpen && (
        <div className="hv-modal-overlay" onClick={() => { setEditorOpen(false); setEditorId(null); }}>
          <div id="cc-editor" className="hv-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="hv-modal-header">
              <h3 className="hv-modal-title"><Calendar size={16} style={{ display: 'inline', marginRight: '8px', color: 'var(--color-primary)' }} />{editorId ? 'Edit Case Conference' : 'Schedule Case Conference'}</h3>
              <button className="hv-modal-close" onClick={() => { setEditorOpen(false); setEditorId(null); }} aria-label="Close"><X size={20} /></button>
            </div>
            <div className="hv-modal-body">
              {errorMessage ? (
                <AlertBanner type="warning" message={errorMessage} onClose={() => setErrorMessage('')} />
              ) : null}
              <div className="hv-editor-grid">
                <div className="hv-editor-column">
                  <label className="hv-filter-label">Resident</label>
                  <select className="hv-filter-select" value={editorForm.residentId} onChange={(e) => setEditorForm({ ...editorForm, residentId: e.target.value })}>
                    <option value="">— Select Resident —</option>
                    {residents.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
                  </select>
                  <label className="hv-filter-label">Conference Date *</label>
                  <input type="date" className="hv-filter-input" value={editorForm.caseConferenceDate} onChange={(e) => setEditorForm({ ...editorForm, caseConferenceDate: e.target.value })} />
                  <label className="hv-filter-label">Category</label>
                  <input className="hv-filter-input" value={editorForm.planCategory} onChange={(e) => setEditorForm({ ...editorForm, planCategory: e.target.value })} placeholder="e.g. Reintegration, Health" />
                  <label className="hv-filter-label">Status</label>
                  <select className="hv-filter-select" value={editorForm.status} onChange={(e) => setEditorForm({ ...editorForm, status: e.target.value })}>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="hv-editor-column">
                  <label className="hv-filter-label">Services / Topics Discussed</label>
                  <textarea className="hv-filter-textarea" rows={3} value={editorForm.servicesProvided} onChange={(e) => setEditorForm({ ...editorForm, servicesProvided: e.target.value })} placeholder="Services or topics to be discussed..." />
                  <label className="hv-filter-label">Plan Description / Notes</label>
                  <textarea className="hv-filter-textarea" rows={4} value={editorForm.planDescription} onChange={(e) => setEditorForm({ ...editorForm, planDescription: e.target.value })} placeholder="Plans agreed upon or observations..." />
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <SecondaryButton onClick={() => { setEditorOpen(false); setEditorId(null); }}>Cancel</SecondaryButton>
                <PrimaryButton onClick={() => { void handleSave(); }} disabled={isSaving}>{isSaving ? 'Saving...' : editorId ? 'Update Conference' : 'Schedule Conference'}</PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId !== null && <ConfirmDialog message="Delete this case conference record?" onConfirm={() => { void handleDelete(); }} onCancel={() => setConfirmDeleteId(null)} />}
    </>
  );
}

/* ===== Main Page ===== */
export default function HomeVisitsPage() {
  const [searchParams] = useSearchParams();
  const prefilledResidentId = searchParams.get('residentId') ?? '';
  const [activeTab, setActiveTab] = useState<'visits' | 'conferences'>('visits');
  const [residents, setResidents] = useState<ResidentOption[]>([]);

  useEffect(() => {
    getAdminResidentOptions().then(setResidents).catch(() => { });
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="admin-page-header" style={{ marginBottom: '24px' }}>
        <h1 className="admin-page-title">Home Visits &amp; Case Conferences</h1>
        <p className="admin-page-subtitle">Log home visits, field assessments, and multi-disciplinary case conferences.</p>
      </div>

      {/* Tabs */}
      <div className="hv-tabs">
        <button className={`hv-tab ${activeTab === 'visits' ? 'active' : ''}`} onClick={() => setActiveTab('visits')}>
          <Home size={15} /> Home Visits
        </button>
        <button className={`hv-tab ${activeTab === 'conferences' ? 'active' : ''}`} onClick={() => setActiveTab('conferences')}>
          <Calendar size={15} /> Case Conferences
        </button>
      </div>

      {activeTab === 'visits' ? (
        <HomeVisitsTab residents={residents} prefilledResidentId={prefilledResidentId} />
      ) : (
        <CaseConferencesTab residents={residents} />
      )}
    </div>
  );
}
