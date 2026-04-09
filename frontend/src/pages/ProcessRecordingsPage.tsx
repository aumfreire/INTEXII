import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  FileText,
  MoreVertical,
  PencilLine,
  Trash2,
  X,
  Plus,
  Inbox,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  PhoneCall,
} from 'lucide-react';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import AlertBanner from '../components/ui/AlertBanner';
import {
  getAdminProcessRecordings,
  createAdminProcessRecording,
  updateAdminProcessRecording,
  deleteAdminProcessRecording,
  getAdminResidentOptions,
  type ProcessRecordingListItem,
  type ProcessRecordingUpsertRequest,
  type ResidentOption,
} from '../lib/authAPI';
import '../styles/pages/process-recordings.css';

/* ===== Types & Labels ===== */
const sessionTypeLabels: Record<string, string> = {
  individual: 'Individual',
  group: 'Group',
  family: 'Family',
  crisis: 'Crisis',
};

const emotionOptions = ['Calm', 'Anxious', 'Sad', 'Angry', 'Hopeful', 'Withdrawn', 'Resistant', 'Engaged', 'Distressed', 'Neutral'];

interface RecordingForm {
  residentId: string;
  sessionDate: string;
  socialWorker: string;
  sessionType: string;
  sessionDurationMinutes: string;
  emotionalStateObserved: string;
  emotionalStateEnd: string;
  sessionNarrative: string;
  interventionsApplied: string;
  followUpActions: string;
  progressNoted: boolean;
  concernsFlagged: boolean;
  referralMade: boolean;
}

const emptyForm: RecordingForm = {
  residentId: '', sessionDate: '', socialWorker: '', sessionType: 'individual',
  sessionDurationMinutes: '', emotionalStateObserved: '', emotionalStateEnd: '',
  sessionNarrative: '', interventionsApplied: '', followUpActions: '',
  progressNoted: false, concernsFlagged: false, referralMade: false,
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
    <div className="pr-actions" ref={ref}>
      <button className="pr-actions-btn" onClick={() => setOpen(!open)} aria-label="Actions">
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="pr-actions-menu">
          <button className="pr-actions-menu-item" onClick={() => { setOpen(false); onEdit(id); }}>
            <PencilLine size={14} /> Edit
          </button>
          <button className="pr-actions-menu-item danger" onClick={() => { setOpen(false); onDelete(id); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== Confirm Dialog ===== */
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

/* ===== Main Page ===== */
export default function ProcessRecordingsPage() {
  const [searchParams] = useSearchParams();
  const prefilledResidentId = searchParams.get('residentId');

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [recordings, setRecordings] = useState<ProcessRecordingListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [search, setSearch] = useState('');
  const [filterResidentId, setFilterResidentId] = useState(prefilledResidentId ?? '');
  const [filterSessionType, setFilterSessionType] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorId, setEditorId] = useState<number | null>(null);
  const [editorForm, setEditorForm] = useState<RecordingForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  useEffect(() => {
    getAdminResidentOptions().then(setResidents).catch(() => { });
  }, []);

  useEffect(() => {
    void loadRecordings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterResidentId, filterSessionType]);

  async function loadRecordings() {
    setIsLoading(true);
    try {
      const result = await getAdminProcessRecordings({
        search: search || undefined,
        residentId: filterResidentId ? Number(filterResidentId) : undefined,
        sessionType: filterSessionType || undefined,
        page,
        pageSize,
      });
      setRecordings(result.items);
      setTotal(result.total);
    } catch {
      setErrorMessage('Unable to load process recordings.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSearch() {
    setPage(1);
    void loadRecordings();
  }

  function openCreate() {
    setEditorId(null);
    setEditorForm({ ...emptyForm, residentId: filterResidentId });
    setEditorOpen(true);
  }

  function openEdit(id: number) {
    const rec = recordings.find((r) => r.id === id);
    if (!rec) return;
    setEditorId(id);
    setEditorForm({
      residentId: rec.residentId ? String(rec.residentId) : '',
      sessionDate: rec.sessionDate ?? '',
      socialWorker: rec.socialWorker ?? '',
      sessionType: rec.sessionType ?? 'individual',
      sessionDurationMinutes: '',
      emotionalStateObserved: '',
      emotionalStateEnd: '',
      sessionNarrative: '',
      interventionsApplied: '',
      followUpActions: '',
      progressNoted: rec.progressNoted,
      concernsFlagged: rec.concernsFlagged,
      referralMade: rec.referralMade,
    });
    setEditorOpen(true);
  }

  async function handleSave() {
    if (!editorForm.sessionDate) { setErrorMessage('Session date is required.'); return; }
    setIsSaving(true);
    try {
      const payload: ProcessRecordingUpsertRequest = {
        residentId: editorForm.residentId ? Number(editorForm.residentId) : null,
        sessionDate: editorForm.sessionDate || null,
        socialWorker: editorForm.socialWorker || null,
        sessionType: editorForm.sessionType || null,
        sessionDurationMinutes: editorForm.sessionDurationMinutes ? Number(editorForm.sessionDurationMinutes) : null,
        emotionalStateObserved: editorForm.emotionalStateObserved || null,
        emotionalStateEnd: editorForm.emotionalStateEnd || null,
        sessionNarrative: editorForm.sessionNarrative || null,
        interventionsApplied: editorForm.interventionsApplied || null,
        followUpActions: editorForm.followUpActions || null,
        progressNoted: editorForm.progressNoted,
        concernsFlagged: editorForm.concernsFlagged,
        referralMade: editorForm.referralMade,
      };
      if (editorId) {
        await updateAdminProcessRecording(editorId, payload);
      } else {
        await createAdminProcessRecording(payload);
      }
      setEditorOpen(false);
      setEditorId(null);
      setEditorForm(emptyForm);
      void loadRecordings();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to save recording.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDeleteId) return;
    try {
      await deleteAdminProcessRecording(confirmDeleteId);
      setConfirmDeleteId(null);
      void loadRecordings();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to delete recording.');
      setConfirmDeleteId(null);
    }
  }

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      {/* Header */}
      <div className="pr-header">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Process Recordings</h1>
          <p className="admin-page-subtitle">Counseling session notes and documentation for all residents.</p>
        </div>
        <PrimaryButton onClick={openCreate}>
          <Plus size={16} /> New Recording
        </PrimaryButton>
      </div>

      {errorMessage && (
        <AlertBanner type="warning" message={errorMessage} onClose={() => setErrorMessage('')} />
      )}

      {/* Filters */}
      <div className="pr-filters">
        <div className="pr-filter-group">
          <label className="pr-filter-label" htmlFor="pr-search">Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
            <input id="pr-search" className="pr-filter-input" placeholder="Worker, narrative..." value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} style={{ paddingLeft: '34px' }} />
          </div>
        </div>
        <div className="pr-filter-group">
          <label className="pr-filter-label" htmlFor="pr-resident">Resident</label>
          <select id="pr-resident" className="pr-filter-select" value={filterResidentId} onChange={(e) => { setFilterResidentId(e.target.value); setPage(1); }}>
            <option value="">All Residents</option>
            {residents.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
          </select>
        </div>
        <div className="pr-filter-group">
          <label className="pr-filter-label" htmlFor="pr-type">Session Type</label>
          <select id="pr-type" className="pr-filter-select" value={filterSessionType} onChange={(e) => { setFilterSessionType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {Object.entries(sessionTypeLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
          </select>
        </div>
        <button className="pr-search-btn" onClick={handleSearch}>Search</button>
      </div>

      {/* Table */}
      <div className="pr-table-wrap">
        {isLoading ? (
          <div className="pr-state">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="pr-skeleton-row">
                <div className="pr-skeleton-bar" style={{ width: '100px' }} />
                <div className="pr-skeleton-bar" style={{ width: '140px' }} />
                <div className="pr-skeleton-bar" style={{ width: '80px' }} />
                <div className="pr-skeleton-bar" style={{ flex: 1 }} />
              </div>
            ))}
          </div>
        ) : recordings.length === 0 ? (
          <div className="pr-state">
            <div className="pr-state-icon"><Inbox size={44} /></div>
            <h3 className="pr-state-title">No recordings found</h3>
            <p className="pr-state-text">No process recordings match your current filters.</p>
            <button className="pr-clear-btn" onClick={() => { setSearch(''); setFilterResidentId(''); setFilterSessionType(''); setPage(1); void loadRecordings(); }}>
              <RefreshCw size={14} /> Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="pr-table-scroll">
              <table className="pr-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Resident</th>
                    <th>Social Worker</th>
                    <th>Type</th>
                    <th>Flags</th>
                    <th style={{ width: '60px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {recordings.map((r) => (
                    <tr key={r.id}>
                      <td className="pr-date">{formatDate(r.sessionDate)}</td>
                      <td>
                        {r.residentId ? (
                          <Link to={`/admin/residents/${r.residentId}`} className="pr-resident-link" style={{ textDecoration: 'none' }}>
                            <div className="pr-resident-name">{r.residentName}</div>
                          </Link>
                        ) : (
                          <div className="pr-resident-name">{r.residentName}</div>
                        )}
                      </td>
                      <td className="pr-worker">{r.socialWorker ?? '—'}</td>
                      <td>
                        <span className="pr-badge">{sessionTypeLabels[r.sessionType ?? ''] ?? r.sessionType ?? '—'}</span>
                      </td>
                      <td>
                        <div className="pr-flags">
                          {r.progressNoted && <span className="pr-flag progress" title="Progress Noted"><CheckCircle size={14} /></span>}
                          {r.concernsFlagged && <span className="pr-flag concern" title="Concerns Flagged"><AlertCircle size={14} /></span>}
                          {r.referralMade && <span className="pr-flag referral" title="Referral Made"><PhoneCall size={14} /></span>}
                        </div>
                      </td>
                      <td><ActionMenu id={r.id} onEdit={openEdit} onDelete={(id) => setConfirmDeleteId(id)} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            <div className="pr-table-footer">
              <span>Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}</span>
              <div className="pr-pagination">
                <button className="pr-page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>‹ Prev</button>
                <span className="pr-page-info">Page {page} of {totalPages || 1}</span>
                <button className="pr-page-btn" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next ›</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Editor Panel */}
      {editorOpen && (
        <div className="pr-modal-overlay" onClick={() => { setEditorOpen(false); setEditorId(null); setEditorForm(emptyForm); }}>
          <div id="pr-editor" className="pr-modal-panel" onClick={(e) => e.stopPropagation()}>
            <div className="pr-modal-header">
              <h3 className="pr-modal-title">
                <FileText size={16} style={{ display: 'inline', marginRight: '8px', color: 'var(--color-primary)' }} />
                {editorId ? 'Edit Process Recording' : 'New Process Recording'}
              </h3>
              <button className="pr-modal-close" onClick={() => { setEditorOpen(false); setEditorId(null); setEditorForm(emptyForm); }} aria-label="Close">
                <X size={20} />
              </button>
            </div>
            <div className="pr-modal-body">
              <div className="pr-editor-grid">
                {/* Left */}
                <div className="pr-editor-column">
                  <label className="pr-filter-label" htmlFor="f-resident">Resident *</label>
                  <select id="f-resident" className="pr-filter-select" value={editorForm.residentId} onChange={(e) => setEditorForm({ ...editorForm, residentId: e.target.value })}>
                    <option value="">— Select Resident —</option>
                    {residents.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
                  </select>

                  <label className="pr-filter-label" htmlFor="f-date">Session Date *</label>
                  <input id="f-date" type="date" className="pr-filter-input" value={editorForm.sessionDate} onChange={(e) => setEditorForm({ ...editorForm, sessionDate: e.target.value })} />

                  <label className="pr-filter-label" htmlFor="f-worker">Social Worker</label>
                  <input id="f-worker" className="pr-filter-input" value={editorForm.socialWorker} onChange={(e) => setEditorForm({ ...editorForm, socialWorker: e.target.value })} placeholder="Social worker name" />

                  <label className="pr-filter-label" htmlFor="f-type">Session Type</label>
                  <select id="f-type" className="pr-filter-select" value={editorForm.sessionType} onChange={(e) => setEditorForm({ ...editorForm, sessionType: e.target.value })}>
                    {Object.entries(sessionTypeLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>

                  <label className="pr-filter-label" htmlFor="f-duration">Duration (minutes)</label>
                  <input id="f-duration" type="number" min="1" max="480" className="pr-filter-input" value={editorForm.sessionDurationMinutes} onChange={(e) => setEditorForm({ ...editorForm, sessionDurationMinutes: e.target.value })} placeholder="e.g. 60" />

                  <label className="pr-filter-label" htmlFor="f-emotion-start">Emotional State (Start)</label>
                  <select id="f-emotion-start" className="pr-filter-select" value={editorForm.emotionalStateObserved} onChange={(e) => setEditorForm({ ...editorForm, emotionalStateObserved: e.target.value })}>
                    <option value="">— Select —</option>
                    {emotionOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>

                  <label className="pr-filter-label" htmlFor="f-emotion-end">Emotional State (End)</label>
                  <select id="f-emotion-end" className="pr-filter-select" value={editorForm.emotionalStateEnd} onChange={(e) => setEditorForm({ ...editorForm, emotionalStateEnd: e.target.value })}>
                    <option value="">— Select —</option>
                    {emotionOptions.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                {/* Right */}
                <div className="pr-editor-column">
                  <label className="pr-filter-label" htmlFor="f-narrative">Session Narrative</label>
                  <textarea id="f-narrative" className="pr-filter-textarea" rows={5} value={editorForm.sessionNarrative} onChange={(e) => setEditorForm({ ...editorForm, sessionNarrative: e.target.value })} placeholder="Describe what happened in the session..." />

                  <label className="pr-filter-label" htmlFor="f-interventions">Interventions Applied</label>
                  <textarea id="f-interventions" className="pr-filter-textarea" rows={3} value={editorForm.interventionsApplied} onChange={(e) => setEditorForm({ ...editorForm, interventionsApplied: e.target.value })} placeholder="Techniques or approaches used..." />

                  <label className="pr-filter-label" htmlFor="f-followup">Follow-Up Actions</label>
                  <textarea id="f-followup" className="pr-filter-textarea" rows={3} value={editorForm.followUpActions} onChange={(e) => setEditorForm({ ...editorForm, followUpActions: e.target.value })} placeholder="Next steps or actions required..." />

                  <div className="pr-flags-form">
                    <label className="pr-check-label">
                      <input type="checkbox" checked={editorForm.progressNoted} onChange={(e) => setEditorForm({ ...editorForm, progressNoted: e.target.checked })} style={{ accentColor: 'var(--color-sage)' }} />
                      <CheckCircle size={14} style={{ color: 'var(--color-sage)' }} /> Progress Noted
                    </label>
                    <label className="pr-check-label">
                      <input type="checkbox" checked={editorForm.concernsFlagged} onChange={(e) => setEditorForm({ ...editorForm, concernsFlagged: e.target.checked })} style={{ accentColor: '#e67e22' }} />
                      <AlertCircle size={14} style={{ color: '#e67e22' }} /> Concerns Flagged
                    </label>
                    <label className="pr-check-label">
                      <input type="checkbox" checked={editorForm.referralMade} onChange={(e) => setEditorForm({ ...editorForm, referralMade: e.target.checked })} style={{ accentColor: 'var(--color-primary)' }} />
                      <PhoneCall size={14} style={{ color: 'var(--color-primary)' }} /> Referral Made
                    </label>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <SecondaryButton onClick={() => { setEditorOpen(false); setEditorId(null); setEditorForm(emptyForm); }}>Cancel</SecondaryButton>
                <PrimaryButton onClick={() => { void handleSave(); }} disabled={isSaving}>
                  {isSaving ? 'Saving...' : editorId ? 'Update Recording' : 'Save Recording'}
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete */}
      {confirmDeleteId !== null && (
        <ConfirmDialog
          message="Delete this process recording? This action cannot be undone."
          onConfirm={() => { void handleDelete(); }}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
}
