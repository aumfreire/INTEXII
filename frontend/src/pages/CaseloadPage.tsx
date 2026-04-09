import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  UserPlus,
  Users,
  AlertTriangle,
  ArrowRightLeft,
  UserCheck,
  MoreVertical,
  Eye,
  PencilLine,
  XCircle,
  RefreshCw,
  Inbox,
  X,
  FileText,
  Home,
} from 'lucide-react';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import AlertBanner from '../components/ui/AlertBanner';
import {
  getAdminCaseload,
  getAdminSafehouses,
  createAdminResident,
  updateAdminResident,
  closeAdminResident,
  getAdminResidentDetail,
  type AdminCaseloadResident,
  type SafehouseItem,
  type ResidentUpsertRequest,
} from '../lib/authAPI';
import '../styles/pages/caseload.css';

/* ===== Types ===== */
type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
type CaseStatus = 'active' | 'intake' | 'reintegration' | 'closed';
type ReintegrationStatus = 'not-started' | 'in-progress' | 'ready';
type CaseCategory = 'trafficking' | 'abuse' | 'neglect' | 'abandonment' | 'runaway';

interface Resident {
  id: string;
  name: string;
  code: string;
  safehouse: string;
  caseStatus: CaseStatus;
  caseCategory: CaseCategory;
  riskLevel: RiskLevel;
  assignedWorker: string;
  reintegrationStatus: ReintegrationStatus;
  lastUpdate: string;
}

interface ResidentForm {
  // Identification
  caseControlNo: string;
  internalCode: string;
  safehouseId: string;
  assignedSocialWorker: string;
  // Demographics
  sex: string;
  dateOfBirth: string;
  placeOfBirth: string;
  religion: string;
  birthStatus: string;
  // Case info
  caseStatus: string;
  caseCategory: string;
  initialRiskLevel: string;
  currentRiskLevel: string;
  referralSource: string;
  referringAgencyPerson: string;
  // Sub-categories
  subCatOrphaned: boolean;
  subCatTrafficked: boolean;
  subCatChildLabor: boolean;
  subCatPhysicalAbuse: boolean;
  subCatSexualAbuse: boolean;
  subCatOsaec: boolean;
  subCatCicl: boolean;
  subCatAtRisk: boolean;
  subCatStreetChild: boolean;
  subCatChildWithHiv: boolean;
  // Special needs
  isPwd: boolean;
  pwdType: string;
  hasSpecialNeeds: boolean;
  specialNeedsDiagnosis: string;
  // Family profile
  familyIs4ps: boolean;
  familySoloParent: boolean;
  familyIndigenous: boolean;
  familyParentPwd: boolean;
  familyInformalSettler: boolean;
  // Dates
  dateOfAdmission: string;
  dateColbRegistered: string;
  dateColbObtained: string;
  dateEnrolled: string;
  dateCaseStudyPrepared: string;
  // Reintegration
  reintegrationType: string;
  reintegrationStatus: string;
}

const emptyForm: ResidentForm = {
  caseControlNo: '', internalCode: '', safehouseId: '', assignedSocialWorker: '',
  sex: '', dateOfBirth: '', placeOfBirth: '', religion: '', birthStatus: '',
  caseStatus: 'intake', caseCategory: '', initialRiskLevel: '', currentRiskLevel: '',
  referralSource: '', referringAgencyPerson: '',
  subCatOrphaned: false, subCatTrafficked: false, subCatChildLabor: false,
  subCatPhysicalAbuse: false, subCatSexualAbuse: false, subCatOsaec: false,
  subCatCicl: false, subCatAtRisk: false, subCatStreetChild: false, subCatChildWithHiv: false,
  isPwd: false, pwdType: '', hasSpecialNeeds: false, specialNeedsDiagnosis: '',
  familyIs4ps: false, familySoloParent: false, familyIndigenous: false,
  familyParentPwd: false, familyInformalSettler: false,
  dateOfAdmission: '', dateColbRegistered: '', dateColbObtained: '',
  dateEnrolled: '', dateCaseStudyPrepared: '',
  reintegrationType: '', reintegrationStatus: '',
};

/* ===== Label Maps ===== */
const riskLabels: Record<RiskLevel, string> = { low: 'Low', moderate: 'Moderate', high: 'High', critical: 'Critical' };
const statusLabels: Record<CaseStatus, string> = { active: 'Active', intake: 'Intake', reintegration: 'Reintegration', closed: 'Closed' };
const categoryLabels: Record<CaseCategory, string> = { trafficking: 'Trafficking', abuse: 'Abuse', neglect: 'Neglect', abandonment: 'Abandonment', runaway: 'Runaway' };
const reintLabels: Record<ReintegrationStatus, string> = { 'not-started': 'Not Started', 'in-progress': 'In Progress', ready: 'Ready' };

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ===== Action Menu ===== */
function ActionMenu({
  residentId,
  onEdit,
  onClose,
}: {
  residentId: string;
  onEdit: (id: string) => void;
  onClose: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="caseload-actions" ref={ref}>
      <button
        className="caseload-actions-btn"
        onClick={() => setOpen(!open)}
        aria-label="Actions"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="caseload-actions-menu">
          <button className="caseload-actions-menu-item" onClick={() => { setOpen(false); navigate(`/admin/residents/${residentId}`); }}>
            <Eye size={15} className="menu-icon" />
            View Profile
          </button>
          <button className="caseload-actions-menu-item" onClick={() => { setOpen(false); onEdit(residentId); }}>
            <PencilLine size={15} className="menu-icon" />
            Edit Resident
          </button>
          <button className="caseload-actions-menu-item" onClick={() => { setOpen(false); navigate(`/admin/process-recordings?residentId=${residentId}`); }}>
            <FileText size={15} className="menu-icon" />
            Process Recordings
          </button>
          <button className="caseload-actions-menu-item" onClick={() => { setOpen(false); navigate(`/admin/home-visits?residentId=${residentId}`); }}>
            <Home size={15} className="menu-icon" />
            Home Visits
          </button>
          <button
            className="caseload-actions-menu-item danger"
            onClick={() => { setOpen(false); onClose(residentId); }}
          >
            <XCircle size={15} className="menu-icon" />
            Close Case
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== Confirm Dialog ===== */
function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirm',
  danger = false,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
    }}>
      <div style={{
        backgroundColor: 'var(--color-white)', borderRadius: 'var(--radius-md)',
        padding: '28px 32px', maxWidth: '420px', width: '90%',
        boxShadow: 'var(--shadow-lg)',
      }}>
        <p style={{ margin: '0 0 20px', fontSize: '0.95rem', color: 'var(--color-dark)', lineHeight: 1.6 }}>{message}</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 20px', borderRadius: 'var(--radius-sm)', border: 'none',
              backgroundColor: danger ? '#c0392b' : 'var(--color-primary)',
              color: '#fff', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===== Section Label ===== */
function FormSection({ title }: { title: string }) {
  return (
    <h4 style={{
      margin: '20px 0 10px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
      textTransform: 'uppercase', color: 'var(--color-primary)',
    }}>{title}</h4>
  );
}

/* ===== Checkbox Row ===== */
function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: 'var(--color-dark)', cursor: 'pointer', marginBottom: '6px' }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ accentColor: 'var(--color-primary)', width: '15px', height: '15px' }} />
      {label}
    </label>
  );
}

/* ===== Main Page ===== */
export default function CaseloadPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [residents, setResidents] = useState<Resident[]>([]);
  const [safehouses, setSafehouses] = useState<SafehouseItem[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSafehouse, setFilterSafehouse] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRisk, setFilterRisk] = useState('');

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorId, setEditorId] = useState<string | null>(null);
  const [editorForm, setEditorForm] = useState<ResidentForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  // Confirm close
  const [confirmCloseId, setConfirmCloseId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setIsLoading(true);
      setHasError(false);
      try {
        const [caseloadData, safehouseData] = await Promise.all([
          getAdminCaseload(),
          getAdminSafehouses(),
        ]);
        if (!isMounted) return;
        setResidents(caseloadData.map(mapAdminResidentToUiResident));
        setSafehouses(safehouseData);
      } catch {
        if (!isMounted) return;
        setHasError(true);
        setErrorMessage('Unable to load caseload data.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    void load();
    return () => { isMounted = false; };
  }, []);

  async function reloadCaseload() {
    try {
      const data = await getAdminCaseload();
      setResidents(data.map(mapAdminResidentToUiResident));
    } catch { /* silent */ }
  }

  function openCreate() {
    setEditorId(null);
    setEditorForm(emptyForm);
    setEditorOpen(true);
  }

  async function openEdit(id: string) {
    try {
      const detail = await getAdminResidentDetail(id);
      setEditorId(id);
      setEditorForm({
        caseControlNo: detail.caseControlNumber ?? '',
        internalCode: detail.code ?? '',
        safehouseId: '',
        assignedSocialWorker: detail.assignedWorker ?? '',
        sex: detail.gender ?? '',
        dateOfBirth: detail.dateOfBirth ?? '',
        placeOfBirth: detail.nationality ?? '',
        religion: '',
        birthStatus: detail.familyStatus ?? '',
        caseStatus: detail.caseStatus ?? 'active',
        caseCategory: detail.caseCategory ?? '',
        initialRiskLevel: detail.riskLevel ?? '',
        currentRiskLevel: detail.riskLevel ?? '',
        referralSource: detail.referralSource ?? '',
        referringAgencyPerson: detail.referralOfficer ?? '',
        subCatOrphaned: false, subCatTrafficked: false, subCatChildLabor: false,
        subCatPhysicalAbuse: false, subCatSexualAbuse: false, subCatOsaec: false,
        subCatCicl: false, subCatAtRisk: false, subCatStreetChild: false, subCatChildWithHiv: false,
        isPwd: false, pwdType: '', hasSpecialNeeds: false, specialNeedsDiagnosis: '',
        familyIs4ps: false, familySoloParent: false, familyIndigenous: false,
        familyParentPwd: false, familyInformalSettler: false,
        dateOfAdmission: detail.admissionDate ?? '',
        dateColbRegistered: detail.referralDate ?? '',
        dateColbObtained: '', dateEnrolled: '', dateCaseStudyPrepared: '',
        reintegrationType: detail.reintegrationType ?? '',
        reintegrationStatus: detail.reintegrationStatus ?? '',
      });
      setEditorOpen(true);
    } catch {
      setErrorMessage('Unable to load resident details for editing.');
    }
  }

  async function handleSave() {
    if (!editorForm.caseStatus) {
      setErrorMessage('Case status is required.');
      return;
    }
    setIsSaving(true);
    try {
      const payload: ResidentUpsertRequest = {
        caseControlNo: editorForm.caseControlNo || null,
        internalCode: editorForm.internalCode || null,
        safehouseId: editorForm.safehouseId ? Number(editorForm.safehouseId) : null,
        assignedSocialWorker: editorForm.assignedSocialWorker || null,
        sex: editorForm.sex || null,
        dateOfBirth: editorForm.dateOfBirth || null,
        placeOfBirth: editorForm.placeOfBirth || null,
        religion: editorForm.religion || null,
        birthStatus: editorForm.birthStatus || null,
        caseStatus: editorForm.caseStatus,
        caseCategory: editorForm.caseCategory || null,
        initialRiskLevel: editorForm.initialRiskLevel || null,
        currentRiskLevel: editorForm.currentRiskLevel || null,
        referralSource: editorForm.referralSource || null,
        referringAgencyPerson: editorForm.referringAgencyPerson || null,
        subCatOrphaned: editorForm.subCatOrphaned,
        subCatTrafficked: editorForm.subCatTrafficked,
        subCatChildLabor: editorForm.subCatChildLabor,
        subCatPhysicalAbuse: editorForm.subCatPhysicalAbuse,
        subCatSexualAbuse: editorForm.subCatSexualAbuse,
        subCatOsaec: editorForm.subCatOsaec,
        subCatCicl: editorForm.subCatCicl,
        subCatAtRisk: editorForm.subCatAtRisk,
        subCatStreetChild: editorForm.subCatStreetChild,
        subCatChildWithHiv: editorForm.subCatChildWithHiv,
        isPwd: editorForm.isPwd,
        pwdType: editorForm.pwdType || null,
        hasSpecialNeeds: editorForm.hasSpecialNeeds,
        specialNeedsDiagnosis: editorForm.specialNeedsDiagnosis || null,
        familyIs4ps: editorForm.familyIs4ps,
        familySoloParent: editorForm.familySoloParent,
        familyIndigenous: editorForm.familyIndigenous,
        familyParentPwd: editorForm.familyParentPwd,
        familyInformalSettler: editorForm.familyInformalSettler,
        dateOfAdmission: editorForm.dateOfAdmission || null,
        dateColbRegistered: editorForm.dateColbRegistered || null,
        dateColbObtained: editorForm.dateColbObtained || null,
        dateEnrolled: editorForm.dateEnrolled || null,
        dateCaseStudyPrepared: editorForm.dateCaseStudyPrepared || null,
        reintegrationType: editorForm.reintegrationType || null,
        reintegrationStatus: editorForm.reintegrationStatus || null,
      };

      if (editorId) {
        await updateAdminResident(Number(editorId), payload);
      } else {
        await createAdminResident(payload);
      }

      setEditorOpen(false);
      setEditorId(null);
      setEditorForm(emptyForm);
      await reloadCaseload();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to save resident.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmClose() {
    if (!confirmCloseId) return;
    try {
      await closeAdminResident(Number(confirmCloseId));
      setConfirmCloseId(null);
      await reloadCaseload();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unable to close case.');
      setConfirmCloseId(null);
    }
  }

  function f(name: keyof ResidentForm, value: string) {
    setEditorForm((prev) => ({ ...prev, [name]: value }));
  }

  function fc(name: keyof ResidentForm, value: boolean) {
    setEditorForm((prev) => ({ ...prev, [name]: value }));
  }

  // Filtered results
  const allSafehouseNames = [...new Set(residents.map((r) => r.safehouse))].sort();
  const filtered = residents.filter((r) => {
    if (search) {
      const q = search.toLowerCase();
      if (!r.name.toLowerCase().includes(q) && !r.code.toLowerCase().includes(q)) return false;
    }
    if (filterStatus && r.caseStatus !== filterStatus) return false;
    if (filterSafehouse && r.safehouse !== filterSafehouse) return false;
    if (filterCategory && r.caseCategory !== filterCategory) return false;
    if (filterRisk && r.riskLevel !== filterRisk) return false;
    return true;
  });

  const activeCount = residents.filter((r) => r.caseStatus === 'active').length;
  const highRiskCount = residents.filter((r) => r.riskLevel === 'high' || r.riskLevel === 'critical').length;
  const pendingReintCount = residents.filter((r) => r.reintegrationStatus === 'in-progress').length;
  const newAdmissions = residents.filter((r) => r.caseStatus === 'intake').length;

  return (
    <div>
      {/* Page Header */}
      <div className="caseload-header">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Caseload</h1>
          <p className="admin-page-subtitle">
            Your assigned residents and case statuses at a glance.
          </p>
        </div>
        <PrimaryButton onClick={openCreate}>
          <UserPlus size={16} />
          Add Resident
        </PrimaryButton>
      </div>

      {/* Error State */}
      {(hasError || errorMessage) && (
        <AlertBanner
          type="warning"
          message={errorMessage || 'Unable to load caseload data.'}
          onClose={() => { setHasError(false); setErrorMessage(''); }}
        />
      )}

      {isLoading ? (
        <>
          <div className="caseload-summary">
            {[1, 2, 3, 4].map((i) => (
              <div className="caseload-chip" key={i}>
                <div className="caseload-chip-icon" style={{ backgroundColor: 'var(--color-cream)' }}>
                  <div className="caseload-skeleton-bar" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="caseload-skeleton-bar" style={{ width: '40px', height: '20px', marginBottom: '6px' }} />
                  <div className="caseload-skeleton-bar" style={{ width: '80px', height: '12px' }} />
                </div>
              </div>
            ))}
          </div>
          <div className="caseload-state" style={{ padding: '0' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div className="caseload-skeleton-row" key={i}>
                <div className="caseload-skeleton-bar" style={{ width: '120px' }} />
                <div className="caseload-skeleton-bar" style={{ width: '90px' }} />
                <div className="caseload-skeleton-bar" style={{ width: '70px' }} />
                <div className="caseload-skeleton-bar" style={{ width: '80px' }} />
                <div className="caseload-skeleton-bar" style={{ flex: 1 }} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Summary Chips */}
          <div className="caseload-summary">
            <div className="caseload-chip">
              <div className="caseload-chip-icon active"><Users size={20} /></div>
              <div>
                <div className="caseload-chip-value">{activeCount}</div>
                <div className="caseload-chip-label">Active Residents</div>
              </div>
            </div>
            <div className="caseload-chip">
              <div className="caseload-chip-icon risk"><AlertTriangle size={20} /></div>
              <div>
                <div className="caseload-chip-value">{highRiskCount}</div>
                <div className="caseload-chip-label">High / Critical Risk</div>
              </div>
            </div>
            <div className="caseload-chip">
              <div className="caseload-chip-icon reintegration"><ArrowRightLeft size={20} /></div>
              <div>
                <div className="caseload-chip-value">{pendingReintCount}</div>
                <div className="caseload-chip-label">Pending Reintegration</div>
              </div>
            </div>
            <div className="caseload-chip">
              <div className="caseload-chip-icon new"><UserCheck size={20} /></div>
              <div>
                <div className="caseload-chip-value">{newAdmissions}</div>
                <div className="caseload-chip-label">New Admissions</div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="caseload-filters">
            <div className="caseload-filters-row">
              <div className="caseload-filter-group">
                <label className="caseload-filter-label" htmlFor="cl-search">Search</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
                  <input id="cl-search" type="text" className="caseload-filter-input" placeholder="Name or case code..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: '36px' }} />
                </div>
              </div>
              <div className="caseload-filter-group">
                <label className="caseload-filter-label" htmlFor="cl-status">Status</label>
                <select id="cl-status" className="caseload-filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  {Object.entries(statusLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              </div>
              <div className="caseload-filter-group">
                <label className="caseload-filter-label" htmlFor="cl-safehouse">Safehouse</label>
                <select id="cl-safehouse" className="caseload-filter-select" value={filterSafehouse} onChange={(e) => setFilterSafehouse(e.target.value)}>
                  <option value="">All Safehouses</option>
                  {allSafehouseNames.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="caseload-filter-group">
                <label className="caseload-filter-label" htmlFor="cl-category">Category</label>
                <select id="cl-category" className="caseload-filter-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  {Object.entries(categoryLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              </div>
              <div className="caseload-filter-group">
                <label className="caseload-filter-label" htmlFor="cl-risk">Risk Level</label>
                <select id="cl-risk" className="caseload-filter-select" value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)}>
                  <option value="">All Levels</option>
                  {Object.entries(riskLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Table or Empty State */}
          {filtered.length === 0 ? (
            <div className="caseload-state">
              <div className="caseload-state-icon"><Inbox size={48} /></div>
              <h3 className="caseload-state-title">No residents found</h3>
              <p className="caseload-state-text">
                {residents.length === 0
                  ? 'There are no residents in the system yet. Add a new resident to get started.'
                  : 'No residents match your current filters.'}
              </p>
              {residents.length > 0 && (
                <button
                  onClick={() => { setSearch(''); setFilterStatus(''); setFilterSafehouse(''); setFilterCategory(''); setFilterRisk(''); }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 20px', backgroundColor: 'transparent', border: '1.5px solid var(--color-light-gray)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-dark)', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
                >
                  <RefreshCw size={14} /> Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="caseload-table-wrap">
              <div className="caseload-table-scroll">
                <table className="caseload-table">
                  <thead>
                    <tr>
                      <th>Resident</th>
                      <th>Safehouse</th>
                      <th>Status</th>
                      <th>Category</th>
                      <th>Risk</th>
                      <th>Social Worker</th>
                      <th>Reintegration</th>
                      <th>Last Update</th>
                      <th style={{ width: '60px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <div className="caseload-resident-name">{r.name}</div>
                          <div className="caseload-resident-code">{r.code}</div>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{r.safehouse}</td>
                        <td><span className={`caseload-badge status-${r.caseStatus}`}>{statusLabels[r.caseStatus]}</span></td>
                        <td style={{ fontSize: '0.85rem' }}>{categoryLabels[r.caseCategory]}</td>
                        <td>
                          <span className={`caseload-badge risk-${r.riskLevel}`}>
                            <span className={`caseload-risk-dot ${r.riskLevel}`} />
                            {riskLabels[r.riskLevel]}
                          </span>
                        </td>
                        <td className="caseload-worker">{r.assignedWorker}</td>
                        <td><span className={`caseload-badge reint-${r.reintegrationStatus}`}>{reintLabels[r.reintegrationStatus]}</span></td>
                        <td className="caseload-date">{formatDate(r.lastUpdate)}</td>
                        <td>
                          <ActionMenu residentId={r.id} onEdit={openEdit} onClose={(id) => setConfirmCloseId(id)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="caseload-table-footer">
                <span>Showing {filtered.length} of {residents.length} resident{residents.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {/* Editor Panel */}
          {editorOpen && (
            <div className="caseload-editor-overlay" onClick={() => { setEditorOpen(false); setEditorId(null); setEditorForm(emptyForm); }}>
              <div className="caseload-editor-panel" onClick={(e) => e.stopPropagation()}>
                <div className="donors-detail-header">
                  <h3 className="donors-detail-title">{editorId ? 'Edit Resident' : 'Add New Resident'}</h3>
                  <button className="donors-detail-close" onClick={() => { setEditorOpen(false); setEditorId(null); setEditorForm(emptyForm); }} aria-label="Close">
                    <X size={20} />
                  </button>
                </div>
                <div className="donors-detail-body">
                  <div className="donors-detail-grid">
                    {/* Left column */}
                    <div>
                      <FormSection title="Identification" />
                      <div className="donors-history-list">
                        <label className="caseload-filter-label" htmlFor="res-code">Case Control No.</label>
                        <input id="res-code" className="caseload-filter-input" value={editorForm.caseControlNo} onChange={(e) => f('caseControlNo', e.target.value)} placeholder="e.g. CC-2026-001" />
                        <label className="caseload-filter-label" htmlFor="res-internal">Internal Code</label>
                        <input id="res-internal" className="caseload-filter-input" value={editorForm.internalCode} onChange={(e) => f('internalCode', e.target.value)} placeholder="e.g. HFG-2026-001" />
                        <label className="caseload-filter-label" htmlFor="res-safehouse">Safehouse</label>
                        <select id="res-safehouse" className="caseload-filter-select" value={editorForm.safehouseId} onChange={(e) => f('safehouseId', e.target.value)}>
                          <option value="">— Select Safehouse —</option>
                          {safehouses.map((s) => <option key={s.safehouseId} value={String(s.safehouseId)}>{s.name ?? `Safehouse #${s.safehouseId}`}</option>)}
                        </select>
                        <label className="caseload-filter-label" htmlFor="res-worker">Assigned Social Worker</label>
                        <input id="res-worker" className="caseload-filter-input" value={editorForm.assignedSocialWorker} onChange={(e) => f('assignedSocialWorker', e.target.value)} placeholder="Social worker name" />
                      </div>

                      <FormSection title="Demographics" />
                      <div className="donors-history-list">
                        <label className="caseload-filter-label" htmlFor="res-sex">Sex</label>
                        <select id="res-sex" className="caseload-filter-select" value={editorForm.sex} onChange={(e) => f('sex', e.target.value)}>
                          <option value="">— Select —</option>
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                        </select>
                        <label className="caseload-filter-label" htmlFor="res-dob">Date of Birth</label>
                        <input id="res-dob" type="date" className="caseload-filter-input" value={editorForm.dateOfBirth} onChange={(e) => f('dateOfBirth', e.target.value)} />
                        <label className="caseload-filter-label" htmlFor="res-pob">Place of Birth</label>
                        <input id="res-pob" className="caseload-filter-input" value={editorForm.placeOfBirth} onChange={(e) => f('placeOfBirth', e.target.value)} placeholder="City / Province" />
                        <label className="caseload-filter-label" htmlFor="res-religion">Religion</label>
                        <input id="res-religion" className="caseload-filter-input" value={editorForm.religion} onChange={(e) => f('religion', e.target.value)} placeholder="Religion" />
                        <label className="caseload-filter-label" htmlFor="res-birth-status">Birth Status</label>
                        <input id="res-birth-status" className="caseload-filter-input" value={editorForm.birthStatus} onChange={(e) => f('birthStatus', e.target.value)} placeholder="Legitimate / Illegitimate" />
                      </div>

                      <FormSection title="Sub-Categories" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <CheckRow label="Orphaned" checked={editorForm.subCatOrphaned} onChange={(v) => fc('subCatOrphaned', v)} />
                        <CheckRow label="Trafficked" checked={editorForm.subCatTrafficked} onChange={(v) => fc('subCatTrafficked', v)} />
                        <CheckRow label="Child Labor" checked={editorForm.subCatChildLabor} onChange={(v) => fc('subCatChildLabor', v)} />
                        <CheckRow label="Physical Abuse" checked={editorForm.subCatPhysicalAbuse} onChange={(v) => fc('subCatPhysicalAbuse', v)} />
                        <CheckRow label="Sexual Abuse" checked={editorForm.subCatSexualAbuse} onChange={(v) => fc('subCatSexualAbuse', v)} />
                        <CheckRow label="OSAEC" checked={editorForm.subCatOsaec} onChange={(v) => fc('subCatOsaec', v)} />
                        <CheckRow label="CICL" checked={editorForm.subCatCicl} onChange={(v) => fc('subCatCicl', v)} />
                        <CheckRow label="At Risk" checked={editorForm.subCatAtRisk} onChange={(v) => fc('subCatAtRisk', v)} />
                        <CheckRow label="Street Child" checked={editorForm.subCatStreetChild} onChange={(v) => fc('subCatStreetChild', v)} />
                        <CheckRow label="Child with HIV" checked={editorForm.subCatChildWithHiv} onChange={(v) => fc('subCatChildWithHiv', v)} />
                      </div>

                      <FormSection title="Family Profile" />
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                        <CheckRow label="4Ps Beneficiary" checked={editorForm.familyIs4ps} onChange={(v) => fc('familyIs4ps', v)} />
                        <CheckRow label="Solo Parent" checked={editorForm.familySoloParent} onChange={(v) => fc('familySoloParent', v)} />
                        <CheckRow label="Indigenous Group" checked={editorForm.familyIndigenous} onChange={(v) => fc('familyIndigenous', v)} />
                        <CheckRow label="Parent with PWD" checked={editorForm.familyParentPwd} onChange={(v) => fc('familyParentPwd', v)} />
                        <CheckRow label="Informal Settler" checked={editorForm.familyInformalSettler} onChange={(v) => fc('familyInformalSettler', v)} />
                      </div>
                    </div>

                    {/* Right column */}
                    <div>
                      <FormSection title="Case Information" />
                      <div className="donors-history-list">
                        <label className="caseload-filter-label" htmlFor="res-status">Case Status *</label>
                        <select id="res-status" className="caseload-filter-select" value={editorForm.caseStatus} onChange={(e) => f('caseStatus', e.target.value)}>
                          <option value="intake">Intake</option>
                          <option value="active">Active</option>
                          <option value="reintegration">Reintegration</option>
                          <option value="closed">Closed</option>
                        </select>
                        <label className="caseload-filter-label" htmlFor="res-category">Case Category</label>
                        <select id="res-category" className="caseload-filter-select" value={editorForm.caseCategory} onChange={(e) => f('caseCategory', e.target.value)}>
                          <option value="">— Select —</option>
                          {Object.entries(categoryLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                        <label className="caseload-filter-label" htmlFor="res-init-risk">Initial Risk Level</label>
                        <select id="res-init-risk" className="caseload-filter-select" value={editorForm.initialRiskLevel} onChange={(e) => f('initialRiskLevel', e.target.value)}>
                          <option value="">— Select —</option>
                          {Object.entries(riskLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                        <label className="caseload-filter-label" htmlFor="res-curr-risk">Current Risk Level</label>
                        <select id="res-curr-risk" className="caseload-filter-select" value={editorForm.currentRiskLevel} onChange={(e) => f('currentRiskLevel', e.target.value)}>
                          <option value="">— Select —</option>
                          {Object.entries(riskLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                        <label className="caseload-filter-label" htmlFor="res-ref-src">Referral Source</label>
                        <input id="res-ref-src" className="caseload-filter-input" value={editorForm.referralSource} onChange={(e) => f('referralSource', e.target.value)} placeholder="Agency / Person" />
                        <label className="caseload-filter-label" htmlFor="res-ref-officer">Referring Agency / Person</label>
                        <input id="res-ref-officer" className="caseload-filter-input" value={editorForm.referringAgencyPerson} onChange={(e) => f('referringAgencyPerson', e.target.value)} placeholder="Officer name" />
                      </div>

                      <FormSection title="Special Needs" />
                      <div className="donors-history-list">
                        <CheckRow label="Person with Disability (PWD)" checked={editorForm.isPwd} onChange={(v) => fc('isPwd', v)} />
                        {editorForm.isPwd && (
                          <>
                            <label className="caseload-filter-label" htmlFor="res-pwd-type">PWD Type</label>
                            <input id="res-pwd-type" className="caseload-filter-input" value={editorForm.pwdType} onChange={(e) => f('pwdType', e.target.value)} placeholder="e.g. Physical, Cognitive" />
                          </>
                        )}
                        <CheckRow label="Has Special Needs" checked={editorForm.hasSpecialNeeds} onChange={(v) => fc('hasSpecialNeeds', v)} />
                        {editorForm.hasSpecialNeeds && (
                          <>
                            <label className="caseload-filter-label" htmlFor="res-sn-diag">Diagnosis</label>
                            <input id="res-sn-diag" className="caseload-filter-input" value={editorForm.specialNeedsDiagnosis} onChange={(e) => f('specialNeedsDiagnosis', e.target.value)} placeholder="Diagnosis" />
                          </>
                        )}
                      </div>

                      <FormSection title="Key Dates" />
                      <div className="donors-history-list">
                        <label className="caseload-filter-label" htmlFor="res-adm-date">Date of Admission</label>
                        <input id="res-adm-date" type="date" className="caseload-filter-input" value={editorForm.dateOfAdmission} onChange={(e) => f('dateOfAdmission', e.target.value)} />
                        <label className="caseload-filter-label" htmlFor="res-colb-reg">COLB Registered</label>
                        <input id="res-colb-reg" type="date" className="caseload-filter-input" value={editorForm.dateColbRegistered} onChange={(e) => f('dateColbRegistered', e.target.value)} />
                        <label className="caseload-filter-label" htmlFor="res-colb-obt">COLB Obtained</label>
                        <input id="res-colb-obt" type="date" className="caseload-filter-input" value={editorForm.dateColbObtained} onChange={(e) => f('dateColbObtained', e.target.value)} />
                        <label className="caseload-filter-label" htmlFor="res-enrolled">Date Enrolled</label>
                        <input id="res-enrolled" type="date" className="caseload-filter-input" value={editorForm.dateEnrolled} onChange={(e) => f('dateEnrolled', e.target.value)} />
                        <label className="caseload-filter-label" htmlFor="res-case-study">Case Study Prepared</label>
                        <input id="res-case-study" type="date" className="caseload-filter-input" value={editorForm.dateCaseStudyPrepared} onChange={(e) => f('dateCaseStudyPrepared', e.target.value)} />
                      </div>

                      <FormSection title="Reintegration" />
                      <div className="donors-history-list">
                        <label className="caseload-filter-label" htmlFor="res-reint-type">Reintegration Type</label>
                        <select id="res-reint-type" className="caseload-filter-select" value={editorForm.reintegrationType} onChange={(e) => f('reintegrationType', e.target.value)}>
                          <option value="">— Select —</option>
                          <option value="family">Family</option>
                          <option value="foster">Foster Care</option>
                          <option value="independent">Independent Living</option>
                          <option value="institutional">Institutional Care</option>
                        </select>
                        <label className="caseload-filter-label" htmlFor="res-reint-status">Reintegration Status</label>
                        <select id="res-reint-status" className="caseload-filter-select" value={editorForm.reintegrationStatus} onChange={(e) => f('reintegrationStatus', e.target.value)}>
                          <option value="">— Select —</option>
                          {Object.entries(reintLabels).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <SecondaryButton onClick={() => { setEditorOpen(false); setEditorId(null); setEditorForm(emptyForm); }}>
                      Cancel
                    </SecondaryButton>
                    <PrimaryButton onClick={() => { void handleSave(); }} disabled={isSaving}>
                      {isSaving ? 'Saving...' : editorId ? 'Update Resident' : 'Create Resident'}
                    </PrimaryButton>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Confirm Close Dialog */}
      {confirmCloseId && (
        <ConfirmDialog
          message="Are you sure you want to close this case? The resident record will be preserved with a closed status. This action can be reversed by editing the resident."
          onConfirm={() => { void handleConfirmClose(); }}
          onCancel={() => setConfirmCloseId(null)}
          confirmLabel="Close Case"
          danger
        />
      )}
    </div>
  );
}

function mapAdminResidentToUiResident(resident: AdminCaseloadResident): Resident {
  return {
    id: String(resident.id),
    name: resident.name,
    code: resident.code,
    safehouse: resident.safehouse,
    caseStatus: normalizeCaseStatus(resident.caseStatus),
    caseCategory: normalizeCaseCategory(resident.caseCategory),
    riskLevel: normalizeRiskLevel(resident.riskLevel),
    assignedWorker: resident.assignedWorker ?? 'Unassigned',
    reintegrationStatus: normalizeReintegrationStatus(resident.reintegrationStatus),
    lastUpdate: (resident.lastUpdate ?? '').slice(0, 10),
  };
}

function normalizeCaseStatus(value: string): CaseStatus {
  const n = value.trim().toLowerCase();
  if (n === 'intake' || n === 'reintegration' || n === 'closed') return n;
  return 'active';
}

function normalizeCaseCategory(value: string): CaseCategory {
  const n = value.trim().toLowerCase();
  if (n === 'trafficking' || n === 'abuse' || n === 'neglect' || n === 'abandonment' || n === 'runaway') return n;
  return 'neglect';
}

function normalizeRiskLevel(value: string): RiskLevel {
  const n = value.trim().toLowerCase();
  if (n === 'low' || n === 'moderate' || n === 'high' || n === 'critical') return n;
  return 'moderate';
}

function normalizeReintegrationStatus(value: string): ReintegrationStatus {
  const n = value.trim().toLowerCase();
  if (n === 'in-progress' || n === 'ready') return n;
  return 'not-started';
}
