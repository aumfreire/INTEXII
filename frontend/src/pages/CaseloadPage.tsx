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
  FileText,
  Home,
  Loader2,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import PrimaryButton from '../components/ui/PrimaryButton';
import AlertBanner from '../components/ui/AlertBanner';
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

/* ===== Mock Data ===== */
const mockResidents: Resident[] = [
  { id: '1', name: 'Grace M.', code: 'HFG-2024-001', safehouse: 'Haven House A', caseStatus: 'active', caseCategory: 'trafficking', riskLevel: 'high', assignedWorker: 'Maria Johnson', reintegrationStatus: 'not-started', lastUpdate: '2026-04-07' },
  { id: '2', name: 'Faith K.', code: 'HFG-2024-002', safehouse: 'Haven House A', caseStatus: 'active', caseCategory: 'abuse', riskLevel: 'moderate', assignedWorker: 'Maria Johnson', reintegrationStatus: 'in-progress', lastUpdate: '2026-04-06' },
  { id: '3', name: 'Hope N.', code: 'HFG-2024-003', safehouse: 'Haven House B', caseStatus: 'reintegration', caseCategory: 'neglect', riskLevel: 'low', assignedWorker: 'Sarah Okonkwo', reintegrationStatus: 'ready', lastUpdate: '2026-04-05' },
  { id: '4', name: 'Joy A.', code: 'HFG-2024-004', safehouse: 'Haven House A', caseStatus: 'intake', caseCategory: 'abandonment', riskLevel: 'critical', assignedWorker: 'Maria Johnson', reintegrationStatus: 'not-started', lastUpdate: '2026-04-08' },
  { id: '5', name: 'Mercy T.', code: 'HFG-2024-005', safehouse: 'Haven House C', caseStatus: 'active', caseCategory: 'trafficking', riskLevel: 'high', assignedWorker: 'Sarah Okonkwo', reintegrationStatus: 'not-started', lastUpdate: '2026-04-04' },
  { id: '6', name: 'Blessing O.', code: 'HFG-2024-006', safehouse: 'Haven House B', caseStatus: 'active', caseCategory: 'abuse', riskLevel: 'moderate', assignedWorker: 'Esther Adeyemi', reintegrationStatus: 'in-progress', lastUpdate: '2026-04-03' },
  { id: '7', name: 'Patience W.', code: 'HFG-2024-007', safehouse: 'Haven House C', caseStatus: 'active', caseCategory: 'runaway', riskLevel: 'low', assignedWorker: 'Esther Adeyemi', reintegrationStatus: 'in-progress', lastUpdate: '2026-04-02' },
  { id: '8', name: 'Charity E.', code: 'HFG-2024-008', safehouse: 'Haven House A', caseStatus: 'closed', caseCategory: 'neglect', riskLevel: 'low', assignedWorker: 'Maria Johnson', reintegrationStatus: 'ready', lastUpdate: '2026-03-28' },
];

/* ===== Label Maps ===== */
const riskLabels: Record<RiskLevel, string> = { low: 'Low', moderate: 'Moderate', high: 'High', critical: 'Critical' };
const statusLabels: Record<CaseStatus, string> = { active: 'Active', intake: 'Intake', reintegration: 'Reintegration', closed: 'Closed' };
const categoryLabels: Record<CaseCategory, string> = { trafficking: 'Trafficking', abuse: 'Abuse', neglect: 'Neglect', abandonment: 'Abandonment', runaway: 'Runaway' };
const reintLabels: Record<ReintegrationStatus, string> = { 'not-started': 'Not Started', 'in-progress': 'In Progress', ready: 'Ready' };

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ===== Action Menu Component ===== */
function ActionMenu({ residentId }: { residentId: string }) {
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
          <button className="caseload-actions-menu-item" onClick={() => setOpen(false)}>
            <FileText size={15} className="menu-icon" />
            Add Process Recording
          </button>
          <button className="caseload-actions-menu-item" onClick={() => setOpen(false)}>
            <Home size={15} className="menu-icon" />
            Log Home Visit
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== Main Page ===== */
export default function CaseloadPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSafehouse, setFilterSafehouse] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterRisk, setFilterRisk] = useState('');

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setResidents(mockResidents);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Filtered results
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

  // Summary counts (from full dataset, not filtered)
  const activeCount = residents.filter((r) => r.caseStatus === 'active').length;
  const highRiskCount = residents.filter((r) => r.riskLevel === 'high' || r.riskLevel === 'critical').length;
  const pendingReintCount = residents.filter((r) => r.reintegrationStatus === 'in-progress').length;
  const newAdmissions = residents.filter((r) => r.caseStatus === 'intake').length;

  const safehouses = [...new Set(residents.map((r) => r.safehouse))].sort();

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
        <PrimaryButton onClick={() => {}}>
          <UserPlus size={16} />
          Add Resident
        </PrimaryButton>
      </div>

      {/* Error State */}
      {hasError && (
        <AlertBanner
          type="warning"
          message="Unable to load caseload data. Please try again."
          onClose={() => setHasError(false)}
        />
      )}

      {/* Loading State */}
      {isLoading ? (
        <>
          {/* Skeleton summary chips */}
          <div className="caseload-summary">
            {[1, 2, 3, 4].map((i) => (
              <div className="caseload-chip" key={i}>
                <div
                  className="caseload-chip-icon"
                  style={{ backgroundColor: 'var(--color-cream)' }}
                >
                  <div className="caseload-skeleton-bar" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="caseload-skeleton-bar" style={{ width: '40px', height: '20px', marginBottom: '6px' }} />
                  <div className="caseload-skeleton-bar" style={{ width: '80px', height: '12px' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton table */}
          <div className="caseload-state" style={{ padding: '0' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div className="caseload-skeleton-row" key={i}>
                <div className="caseload-skeleton-bar" style={{ width: '120px' }} />
                <div className="caseload-skeleton-bar" style={{ width: '90px' }} />
                <div className="caseload-skeleton-bar" style={{ width: '70px' }} />
                <div className="caseload-skeleton-bar" style={{ width: '80px' }} />
                <div className="caseload-skeleton-bar" style={{ width: '60px' }} />
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
              <div className="caseload-chip-icon active">
                <Users size={20} />
              </div>
              <div>
                <div className="caseload-chip-value">{activeCount}</div>
                <div className="caseload-chip-label">Active Residents</div>
              </div>
            </div>
            <div className="caseload-chip">
              <div className="caseload-chip-icon risk">
                <AlertTriangle size={20} />
              </div>
              <div>
                <div className="caseload-chip-value">{highRiskCount}</div>
                <div className="caseload-chip-label">High / Critical Risk</div>
              </div>
            </div>
            <div className="caseload-chip">
              <div className="caseload-chip-icon reintegration">
                <ArrowRightLeft size={20} />
              </div>
              <div>
                <div className="caseload-chip-value">{pendingReintCount}</div>
                <div className="caseload-chip-label">Pending Reintegration</div>
              </div>
            </div>
            <div className="caseload-chip">
              <div className="caseload-chip-icon new">
                <UserCheck size={20} />
              </div>
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
                  <Search
                    size={16}
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--color-muted)',
                      pointerEvents: 'none',
                    }}
                  />
                  <input
                    id="cl-search"
                    type="text"
                    className="caseload-filter-input"
                    placeholder="Name or case code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>
              <div className="caseload-filter-group">
                <label className="caseload-filter-label" htmlFor="cl-status">Status</label>
                <select
                  id="cl-status"
                  className="caseload-filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {Object.entries(statusLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="caseload-filter-group">
                <label className="caseload-filter-label" htmlFor="cl-safehouse">Safehouse</label>
                <select
                  id="cl-safehouse"
                  className="caseload-filter-select"
                  value={filterSafehouse}
                  onChange={(e) => setFilterSafehouse(e.target.value)}
                >
                  <option value="">All Safehouses</option>
                  {safehouses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="caseload-filter-group">
                <label className="caseload-filter-label" htmlFor="cl-category">Category</label>
                <select
                  id="cl-category"
                  className="caseload-filter-select"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {Object.entries(categoryLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="caseload-filter-group">
                <label className="caseload-filter-label" htmlFor="cl-risk">Risk Level</label>
                <select
                  id="cl-risk"
                  className="caseload-filter-select"
                  value={filterRisk}
                  onChange={(e) => setFilterRisk(e.target.value)}
                >
                  <option value="">All Levels</option>
                  {Object.entries(riskLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table or Empty State */}
          {filtered.length === 0 ? (
            <div className="caseload-state">
              <div className="caseload-state-icon">
                <Inbox size={48} />
              </div>
              <h3 className="caseload-state-title">No residents found</h3>
              <p className="caseload-state-text">
                {residents.length === 0
                  ? 'There are no residents in the system yet. Add a new resident to get started.'
                  : 'No residents match your current filters. Try adjusting your search or filter criteria.'}
              </p>
              {residents.length > 0 && (
                <button
                  onClick={() => {
                    setSearch('');
                    setFilterStatus('');
                    setFilterSafehouse('');
                    setFilterCategory('');
                    setFilterRisk('');
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 20px',
                    backgroundColor: 'transparent',
                    border: '1.5px solid var(--color-light-gray)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    color: 'var(--color-dark)',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    transition: 'border-color var(--transition-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-primary-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--color-light-gray)';
                  }}
                >
                  <RefreshCw size={14} />
                  Clear Filters
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
                        <td>
                          <span className={`caseload-badge status-${r.caseStatus}`}>
                            {statusLabels[r.caseStatus]}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{categoryLabels[r.caseCategory]}</td>
                        <td>
                          <span className={`caseload-badge risk-${r.riskLevel}`}>
                            <span className={`caseload-risk-dot ${r.riskLevel}`} />
                            {riskLabels[r.riskLevel]}
                          </span>
                        </td>
                        <td className="caseload-worker">{r.assignedWorker}</td>
                        <td>
                          <span className={`caseload-badge reint-${r.reintegrationStatus}`}>
                            {reintLabels[r.reintegrationStatus]}
                          </span>
                        </td>
                        <td className="caseload-date">{formatDate(r.lastUpdate)}</td>
                        <td>
                          <ActionMenu residentId={r.id} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="caseload-table-footer">
                <span>
                  Showing {filtered.length} of {residents.length} resident{residents.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
