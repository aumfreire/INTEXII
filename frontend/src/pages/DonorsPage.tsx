import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Users,
  DollarSign,
  Gift,
  RefreshCw,
  MoreVertical,
  Eye,
  PlusCircle,
  History,
  Inbox,
  Loader2,
  UserPlus,
  X,
} from 'lucide-react';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import AlertBanner from '../components/ui/AlertBanner';
import '../styles/pages/donors.css';

/* ===== Types ===== */
type SupporterType = 'monetary' | 'inkind' | 'volunteer' | 'skills' | 'social' | 'partner';
type SupporterStatus = 'active' | 'inactive' | 'lapsed';
type AcquisitionChannel = 'referral' | 'event' | 'online' | 'church' | 'corporate' | 'walk-in';

interface Contribution {
  date: string;
  description: string;
  amount: string;
}

interface Allocation {
  label: string;
  percent: number;
  color: 'primary' | 'sage' | 'light' | 'dark';
}

interface Supporter {
  id: string;
  name: string;
  organization: string;
  type: SupporterType;
  status: SupporterStatus;
  channel: AcquisitionChannel;
  firstDonation: string;
  lastContribution: string;
  lifetimeValue: string;
  contributions: Contribution[];
  allocations: Allocation[];
}

/* ===== Mock Data ===== */
const mockSupporters: Supporter[] = [
  {
    id: '1', name: 'James & Ruth Okafor', organization: 'Okafor Family Trust',
    type: 'monetary', status: 'active', channel: 'church',
    firstDonation: '2023-02-14', lastContribution: '2026-04-01', lifetimeValue: '$24,500',
    contributions: [
      { date: '2026-04-01', description: 'Monthly recurring gift', amount: '$500' },
      { date: '2026-03-01', description: 'Monthly recurring gift', amount: '$500' },
      { date: '2025-12-20', description: 'Year-end special gift', amount: '$2,000' },
    ],
    allocations: [
      { label: 'General Operations', percent: 45, color: 'primary' },
      { label: 'Haven House A', percent: 30, color: 'sage' },
      { label: 'Education Program', percent: 25, color: 'light' },
    ],
  },
  {
    id: '2', name: 'Aisha Mohammed', organization: 'Green Earth Foods',
    type: 'inkind', status: 'active', channel: 'corporate',
    firstDonation: '2024-06-10', lastContribution: '2026-03-28', lifetimeValue: '$8,200',
    contributions: [
      { date: '2026-03-28', description: 'Monthly food supplies (rice, beans, oil)', amount: '$650' },
      { date: '2026-02-25', description: 'Monthly food supplies', amount: '$620' },
      { date: '2025-12-15', description: 'Holiday food baskets (qty 30)', amount: '$1,200' },
    ],
    allocations: [
      { label: 'Haven House A', percent: 40, color: 'primary' },
      { label: 'Haven House B', percent: 35, color: 'sage' },
      { label: 'Haven House C', percent: 25, color: 'light' },
    ],
  },
  {
    id: '3', name: 'Dr. Emmanuel Adewale', organization: 'Lagos Medical Group',
    type: 'skills', status: 'active', channel: 'referral',
    firstDonation: '2023-09-05', lastContribution: '2026-03-22', lifetimeValue: '$15,000',
    contributions: [
      { date: '2026-03-22', description: 'Pro-bono medical exam (8 residents)', amount: '$2,400' },
      { date: '2026-01-15', description: 'Mental health workshop (4 hours)', amount: '$1,200' },
      { date: '2025-11-10', description: 'Quarterly health screenings', amount: '$1,800' },
    ],
    allocations: [
      { label: 'Medical Services', percent: 70, color: 'primary' },
      { label: 'Mental Health Program', percent: 30, color: 'sage' },
    ],
  },
  {
    id: '4', name: 'Sarah Chen', organization: '',
    type: 'volunteer', status: 'active', channel: 'event',
    firstDonation: '2025-01-20', lastContribution: '2026-04-05', lifetimeValue: '$3,600',
    contributions: [
      { date: '2026-04-05', description: 'Tutoring sessions (12 hours)', amount: '$360' },
      { date: '2026-03-15', description: 'Tutoring sessions (10 hours)', amount: '$300' },
      { date: '2026-02-20', description: 'Art therapy workshop', amount: '$240' },
    ],
    allocations: [
      { label: 'Education Program', percent: 60, color: 'primary' },
      { label: 'Recreation', percent: 40, color: 'light' },
    ],
  },
  {
    id: '5', name: 'Ngozi Eze', organization: 'Voices for Children NGO',
    type: 'partner', status: 'active', channel: 'referral',
    firstDonation: '2022-11-01', lastContribution: '2026-03-30', lifetimeValue: '$42,000',
    contributions: [
      { date: '2026-03-30', description: 'Q1 partnership grant disbursement', amount: '$5,000' },
      { date: '2025-12-31', description: 'Q4 partnership grant disbursement', amount: '$5,000' },
      { date: '2025-09-30', description: 'Q3 partnership grant disbursement', amount: '$5,000' },
    ],
    allocations: [
      { label: 'Reintegration Services', percent: 50, color: 'primary' },
      { label: 'Legal Advocacy', percent: 30, color: 'dark' },
      { label: 'Staff Training', percent: 20, color: 'sage' },
    ],
  },
  {
    id: '6', name: 'Tunde Bakare', organization: '',
    type: 'social', status: 'inactive', channel: 'online',
    firstDonation: '2024-08-15', lastContribution: '2025-06-10', lifetimeValue: '$1,200',
    contributions: [
      { date: '2025-06-10', description: 'Social media fundraiser proceeds', amount: '$450' },
      { date: '2025-02-14', description: 'Valentine\'s awareness campaign', amount: '$380' },
      { date: '2024-12-01', description: 'Giving Tuesday campaign share', amount: '$370' },
    ],
    allocations: [
      { label: 'General Operations', percent: 100, color: 'primary' },
    ],
  },
  {
    id: '7', name: 'Grace Lutheran Church', organization: 'Grace Lutheran Church',
    type: 'monetary', status: 'active', channel: 'church',
    firstDonation: '2022-03-01', lastContribution: '2026-03-15', lifetimeValue: '$36,800',
    contributions: [
      { date: '2026-03-15', description: 'Monthly congregation offering', amount: '$800' },
      { date: '2026-02-15', description: 'Monthly congregation offering', amount: '$800' },
      { date: '2025-12-25', description: 'Christmas special offering', amount: '$3,500' },
    ],
    allocations: [
      { label: 'General Operations', percent: 35, color: 'primary' },
      { label: 'Haven House B', percent: 35, color: 'sage' },
      { label: 'Spiritual Care', percent: 30, color: 'light' },
    ],
  },
  {
    id: '8', name: 'Folake Adeyemi', organization: 'Adeyemi & Associates Law',
    type: 'skills', status: 'lapsed', channel: 'walk-in',
    firstDonation: '2023-05-20', lastContribution: '2025-08-14', lifetimeValue: '$9,500',
    contributions: [
      { date: '2025-08-14', description: 'Pro-bono legal consultation (3 cases)', amount: '$2,100' },
      { date: '2025-04-10', description: 'Legal workshop for staff', amount: '$800' },
      { date: '2025-01-08', description: 'Pro-bono legal consultation (2 cases)', amount: '$1,400' },
    ],
    allocations: [
      { label: 'Legal Advocacy', percent: 80, color: 'dark' },
      { label: 'Staff Training', percent: 20, color: 'sage' },
    ],
  },
];

/* ===== Label Maps ===== */
const typeLabels: Record<SupporterType, string> = {
  monetary: 'Monetary', inkind: 'In-Kind', volunteer: 'Volunteer',
  skills: 'Skills', social: 'Social Media', partner: 'Partner Org',
};
const statusLabels: Record<SupporterStatus, string> = {
  active: 'Active', inactive: 'Inactive', lapsed: 'Lapsed',
};
const channelLabels: Record<AcquisitionChannel, string> = {
  referral: 'Referral', event: 'Event', online: 'Online',
  church: 'Church / Community', corporate: 'Corporate', 'walk-in': 'Walk-in',
};

function formatDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ===== Action Menu Component ===== */
function ActionMenu({
  supporterId,
  onViewProfile,
  onViewHistory,
}: {
  supporterId: string;
  onViewProfile: (id: string) => void;
  onViewHistory: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="donors-actions" ref={ref}>
      <button
        className="donors-actions-btn"
        onClick={() => setOpen(!open)}
        aria-label="Actions"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="donors-actions-menu">
          <button
            className="donors-actions-menu-item"
            onClick={() => { setOpen(false); onViewProfile(supporterId); }}
          >
            <Eye size={15} className="donors-menu-icon" />
            View Profile
          </button>
          <button
            className="donors-actions-menu-item"
            onClick={() => setOpen(false)}
          >
            <PlusCircle size={15} className="donors-menu-icon" />
            Record Contribution
          </button>
          <button
            className="donors-actions-menu-item"
            onClick={() => { setOpen(false); onViewHistory(supporterId); }}
          >
            <History size={15} className="donors-menu-icon" />
            View History
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== Main Page ===== */
export default function DonorsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterChannel, setFilterChannel] = useState('');

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setSupporters(mockSupporters);
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Filtered results
  const filtered = supporters.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !s.name.toLowerCase().includes(q) &&
        !s.organization.toLowerCase().includes(q)
      )
        return false;
    }
    if (filterType && s.type !== filterType) return false;
    if (filterStatus && s.status !== filterStatus) return false;
    if (filterChannel && s.channel !== filterChannel) return false;
    return true;
  });

  // Summary counts (from full dataset)
  const activeCount = supporters.filter((s) => s.status === 'active').length;
  const monthlyDonors = supporters.filter(
    (s) => s.type === 'monetary' && s.status === 'active'
  ).length;
  const inkindCount = supporters.filter((s) => s.type === 'inkind').length;
  const recurringCount = supporters.filter(
    (s) => s.status === 'active' && s.contributions.length >= 3
  ).length;

  const selected = supporters.find((s) => s.id === selectedId) ?? null;

  return (
    <div>
      {/* Page Header */}
      <div className="donors-header">
        <div className="admin-page-header">
          <h1 className="admin-page-title">Supporters &amp; Contributions</h1>
          <p className="admin-page-subtitle">
            Manage donor relationships and track all contributions.
          </p>
        </div>
        <div className="donors-header-actions">
          <SecondaryButton onClick={() => {}}>
            <UserPlus size={16} />
            Add Supporter
          </SecondaryButton>
          <PrimaryButton onClick={() => {}}>
            <PlusCircle size={16} />
            Record Contribution
          </PrimaryButton>
        </div>
      </div>

      {/* Error State */}
      {hasError && (
        <AlertBanner
          type="warning"
          message="Unable to load supporter data. Please try again."
          onClose={() => setHasError(false)}
        />
      )}

      {/* Loading State */}
      {isLoading ? (
        <>
          {/* Skeleton summary chips */}
          <div className="donors-summary">
            {[1, 2, 3, 4].map((i) => (
              <div className="donors-chip" key={i}>
                <div
                  className="donors-chip-icon"
                  style={{ backgroundColor: 'var(--color-cream)' }}
                >
                  <div className="donors-skeleton-bar" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="donors-skeleton-bar" style={{ width: '40px', height: '20px', marginBottom: '6px' }} />
                  <div className="donors-skeleton-bar" style={{ width: '80px', height: '12px' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Skeleton table */}
          <div className="donors-state" style={{ padding: '0' }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div className="donors-skeleton-row" key={i}>
                <div className="donors-skeleton-bar" style={{ width: '130px' }} />
                <div className="donors-skeleton-bar" style={{ width: '80px' }} />
                <div className="donors-skeleton-bar" style={{ width: '60px' }} />
                <div className="donors-skeleton-bar" style={{ width: '90px' }} />
                <div className="donors-skeleton-bar" style={{ width: '90px' }} />
                <div className="donors-skeleton-bar" style={{ flex: 1 }} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          {/* Summary Chips */}
          <div className="donors-summary">
            <div className="donors-chip">
              <div className="donors-chip-icon supporters">
                <Users size={20} />
              </div>
              <div>
                <div className="donors-chip-value">{activeCount}</div>
                <div className="donors-chip-label">Active Supporters</div>
              </div>
            </div>
            <div className="donors-chip">
              <div className="donors-chip-icon monthly">
                <DollarSign size={20} />
              </div>
              <div>
                <div className="donors-chip-value">{monthlyDonors}</div>
                <div className="donors-chip-label">Monthly Donors</div>
              </div>
            </div>
            <div className="donors-chip">
              <div className="donors-chip-icon inkind">
                <Gift size={20} />
              </div>
              <div>
                <div className="donors-chip-value">{inkindCount}</div>
                <div className="donors-chip-label">In-Kind Contributors</div>
              </div>
            </div>
            <div className="donors-chip">
              <div className="donors-chip-icon recurring">
                <RefreshCw size={20} />
              </div>
              <div>
                <div className="donors-chip-value">{recurringCount}</div>
                <div className="donors-chip-label">Recurring Donors</div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="donors-filters">
            <div className="donors-filters-row">
              <div className="donors-filter-group">
                <label className="donors-filter-label" htmlFor="dn-search">Search</label>
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
                    id="dn-search"
                    type="text"
                    className="donors-filter-input"
                    placeholder="Name or organization..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ paddingLeft: '36px' }}
                  />
                </div>
              </div>
              <div className="donors-filter-group">
                <label className="donors-filter-label" htmlFor="dn-type">Type</label>
                <select
                  id="dn-type"
                  className="donors-filter-select"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  {Object.entries(typeLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="donors-filter-group">
                <label className="donors-filter-label" htmlFor="dn-status">Status</label>
                <select
                  id="dn-status"
                  className="donors-filter-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  {Object.entries(statusLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
              <div className="donors-filter-group">
                <label className="donors-filter-label" htmlFor="dn-channel">Channel</label>
                <select
                  id="dn-channel"
                  className="donors-filter-select"
                  value={filterChannel}
                  onChange={(e) => setFilterChannel(e.target.value)}
                >
                  <option value="">All Channels</option>
                  {Object.entries(channelLabels).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table or Empty State */}
          {filtered.length === 0 ? (
            <div className="donors-state">
              <div className="donors-state-icon">
                <Inbox size={48} />
              </div>
              <h3 className="donors-state-title">No supporters found</h3>
              <p className="donors-state-text">
                {supporters.length === 0
                  ? 'There are no supporters in the system yet. Add a new supporter to get started.'
                  : 'No supporters match your current filters. Try adjusting your search or filter criteria.'}
              </p>
              {supporters.length > 0 && (
                <button
                  onClick={() => {
                    setSearch('');
                    setFilterType('');
                    setFilterStatus('');
                    setFilterChannel('');
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
            <div className="donors-table-wrap">
              <div className="donors-table-scroll">
                <table className="donors-table">
                  <thead>
                    <tr>
                      <th>Supporter</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>First Donation</th>
                      <th>Last Contribution</th>
                      <th>Lifetime Value</th>
                      <th style={{ width: '60px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <div className="donors-supporter-name">{s.name}</div>
                          {s.organization && (
                            <div className="donors-supporter-org">{s.organization}</div>
                          )}
                        </td>
                        <td>
                          <span className={`donors-badge type-${s.type}`}>
                            {typeLabels[s.type]}
                          </span>
                        </td>
                        <td>
                          <span className={`donors-badge status-${s.status}`}>
                            {statusLabels[s.status]}
                          </span>
                        </td>
                        <td className="donors-date">{formatDate(s.firstDonation)}</td>
                        <td className="donors-date">{formatDate(s.lastContribution)}</td>
                        <td>
                          <span className="donors-value">{s.lifetimeValue}</span>
                        </td>
                        <td>
                          <ActionMenu
                            supporterId={s.id}
                            onViewProfile={() => setSelectedId(s.id)}
                            onViewHistory={() => setSelectedId(s.id)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="donors-table-footer">
                <span>
                  Showing {filtered.length} of {supporters.length} supporter{supporters.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}

          {/* Contribution Detail Panel */}
          {selected && (
            <div className="donors-detail-panel">
              <div className="donors-detail-header">
                <h3 className="donors-detail-title">
                  {selected.name} — Contribution History
                </h3>
                <button
                  className="donors-detail-close"
                  onClick={() => setSelectedId(null)}
                  aria-label="Close detail panel"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="donors-detail-body">
                <div className="donors-detail-grid">
                  {/* Recent Contributions */}
                  <div>
                    <h4 className="donors-allocation-title">Recent Contributions</h4>
                    <div className="donors-history-list">
                      {selected.contributions.map((c, i) => (
                        <div className="donors-history-item" key={i}>
                          <span className="donors-history-date">{formatDate(c.date)}</span>
                          <span className="donors-history-desc">{c.description}</span>
                          <span className="donors-history-amount">{c.amount}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Allocation */}
                  <div>
                    <h4 className="donors-allocation-title">Allocation by Program</h4>
                    {selected.allocations.map((a, i) => (
                      <div className="donors-alloc-item" key={i}>
                        <div className="donors-alloc-label">
                          <span>{a.label}</span>
                          <span>{a.percent}%</span>
                        </div>
                        <div className="donors-alloc-bar">
                          <div
                            className={`donors-alloc-fill ${a.color}`}
                            style={{ width: `${a.percent}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
