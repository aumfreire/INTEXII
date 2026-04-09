import { useState, useEffect, useRef } from 'react';
import {
  Home, Users, Plus, MoreVertical, Pencil, Trash2,
  Loader2, X, Save, Search,
} from 'lucide-react';
import {
  getAdminSafehouses, createAdminSafehouse, updateAdminSafehouse, deleteAdminSafehouse,
  getAdminPartners, createAdminPartner, updateAdminPartner, deleteAdminPartner,
  type SafehouseItem, type SafehouseUpsertRequest,
  type PartnerItem, type PartnerUpsertRequest,
} from '../lib/authAPI';
import '../styles/pages/settings.css';

/* ===== Shared helpers ===== */
function ConfirmDialog({ title, message, onConfirm, onCancel }: {
  title: string; message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="st-overlay" onClick={onCancel}>
      <div className="st-dialog" onClick={(e) => e.stopPropagation()}>
        <h4 className="st-dialog-title">{title}</h4>
        <p className="st-dialog-text">{message}</p>
        <div className="st-dialog-actions">
          <button className="st-dialog-btn cancel" onClick={onCancel}>Cancel</button>
          <button className="st-dialog-btn danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function ActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);
  return (
    <div className="st-actions" ref={ref}>
      <button className="st-actions-btn" onClick={() => setOpen((o) => !o)}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="st-actions-menu">
          <button className="st-actions-item" onClick={() => { onEdit(); setOpen(false); }}>
            <Pencil size={14} /> Edit
          </button>
          <button className="st-actions-item danger" onClick={() => { onDelete(); setOpen(false); }}>
            <Trash2 size={14} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

/* ===== Safehouses Tab ===== */
type SafehouseForm = { name: string; address: string; capacity: string; status: string; };
const emptySafehouse: SafehouseForm = { name: '', address: '', capacity: '', status: 'active' };

function getSafehouseAddress(item: SafehouseItem): string {
  const location = [item.city, item.province, item.region, item.country].filter(Boolean).join(', ');
  return location || item.notes || '';
}

function SafehousesTab() {
  const [items, setItems] = useState<SafehouseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<SafehouseForm>(emptySafehouse);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      const data = await getAdminSafehouses();
      setItems(data);
    } catch { setError('Failed to load safehouses.'); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptySafehouse);
    setFormError('');
    setEditorOpen(true);
  }

  function openEdit(item: SafehouseItem) {
    setEditingId(item.safehouseId);
    setForm({
      name: item.name ?? '',
      address: getSafehouseAddress(item),
      capacity: String(item.capacityGirls ?? ''),
      status: item.status ?? 'active',
    });
    setFormError('');
    setEditorOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setFormError('Name is required.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const payload: SafehouseUpsertRequest = {
        name: form.name.trim(),
        notes: form.address.trim() || undefined,
        capacityGirls: form.capacity ? Number(form.capacity) : undefined,
        status: form.status || undefined,
      };
      if (editingId) {
        await updateAdminSafehouse(editingId, payload);
      } else {
        await createAdminSafehouse(payload);
      }
      setEditorOpen(false);
      await load();
    } catch { setFormError('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    try {
      await deleteAdminSafehouse(id);
      setItems((prev) => prev.filter((s) => s.safehouseId !== id));
    } catch { setError('Failed to delete safehouse.'); }
    finally { setConfirmId(null); }
  }

  function f(field: keyof SafehouseForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) return (
    <div className="st-state">
      <Loader2 size={28} className="spin-icon" style={{ color: 'var(--color-primary-light)' }} />
    </div>
  );

  return (
    <div>
      {error && <div className="st-error">{error}</div>}

      <div className="st-toolbar">
        <div />
        <button className="st-add-btn" onClick={openCreate}>
          <Plus size={15} /> Add Safehouse
        </button>
      </div>

      <div className="st-table-wrap">
        <div className="st-table-scroll">
          <table className="st-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Capacity</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr><td colSpan={5} className="st-empty-cell">No safehouses found.</td></tr>
              )}
              {items.map((s) => (
                <tr key={s.safehouseId}>
                  <td className="st-name">{s.name}</td>
                  <td className="st-muted">{getSafehouseAddress(s) || '—'}</td>
                  <td>{s.capacityGirls ?? '—'}</td>
                  <td>
                    <span className={`st-badge ${s.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
                      {s.status ?? 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <ActionMenu onEdit={() => openEdit(s)} onDelete={() => setConfirmId(s.safehouseId)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor panel */}
      {editorOpen && (
        <div className="st-panel-overlay" onClick={() => setEditorOpen(false)}>
          <div className="st-panel" onClick={(e) => e.stopPropagation()}>
            <div className="st-panel-header">
              <h3 className="st-panel-title">{editingId ? 'Edit Safehouse' : 'New Safehouse'}</h3>
              <button className="st-panel-close" onClick={() => setEditorOpen(false)}><X size={18} /></button>
            </div>
            <div className="st-panel-body">
              {formError && <div className="st-form-error">{formError}</div>}
              <div className="st-field-group">
                <label className="st-label">Safehouse Name *</label>
                <input className="st-input" value={form.name} onChange={(e) => f('name', e.target.value)} placeholder="e.g. Haven House A" />
              </div>
              <div className="st-field-group">
                <label className="st-label">Address</label>
                <input className="st-input" value={form.address} onChange={(e) => f('address', e.target.value)} placeholder="Street address" />
              </div>
              <div className="st-grid-2">
                <div className="st-field-group">
                  <label className="st-label">Capacity</label>
                  <input className="st-input" type="number" min={0} value={form.capacity} onChange={(e) => f('capacity', e.target.value)} placeholder="0" />
                </div>
                <div className="st-field-group">
                  <label className="st-label">Status</label>
                  <select className="st-select" value={form.status} onChange={(e) => f('status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="under_maintenance">Under Maintenance</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="st-panel-footer">
              <button className="st-cancel-btn" onClick={() => setEditorOpen(false)}>Cancel</button>
              <button className="st-save-btn" onClick={() => void handleSave()} disabled={saving}>
                {saving ? <Loader2 size={14} className="spin-icon" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmId !== null && (
        <ConfirmDialog
          title="Delete Safehouse?"
          message="This will permanently remove the safehouse. This action cannot be undone."
          onConfirm={() => void handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}

/* ===== Partners Tab ===== */
type PartnerForm = {
  partnerName: string; partnerType: string; roleType: string;
  contactName: string; email: string; phone: string;
  region: string; status: string; startDate: string; endDate: string; notes: string;
};
const emptyPartner: PartnerForm = {
  partnerName: '', partnerType: '', roleType: '', contactName: '',
  email: '', phone: '', region: '', status: 'active',
  startDate: '', endDate: '', notes: '',
};

function PartnersTab() {
  const [items, setItems] = useState<PartnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<PartnerForm>(emptyPartner);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);

  useEffect(() => { void load(search); }, []);

  async function load(q: string) {
    setLoading(true);
    try {
      const data = await getAdminPartners(q);
      setItems(data);
    } catch { setError('Failed to load partners.'); }
    finally { setLoading(false); }
  }

  function openCreate() {
    setEditingId(null);
    setForm(emptyPartner);
    setFormError('');
    setEditorOpen(true);
  }

  function openEdit(item: PartnerItem) {
    setEditingId(item.id);
    setForm({
      partnerName: item.partnerName ?? '',
      partnerType: item.partnerType ?? '',
      roleType: item.roleType ?? '',
      contactName: item.contactName ?? '',
      email: item.email ?? '',
      phone: item.phone ?? '',
      region: item.region ?? '',
      status: item.status ?? 'active',
      startDate: item.startDate ?? '',
      endDate: item.endDate ?? '',
      notes: item.notes ?? '',
    });
    setFormError('');
    setEditorOpen(true);
  }

  async function handleSave() {
    if (!form.partnerName.trim()) { setFormError('Partner name is required.'); return; }
    setSaving(true);
    setFormError('');
    try {
      const payload: PartnerUpsertRequest = {
        partnerName: form.partnerName.trim(),
        partnerType: form.partnerType || undefined,
        roleType: form.roleType || undefined,
        contactName: form.contactName || undefined,
        email: form.email || undefined,
        phone: form.phone || undefined,
        region: form.region || undefined,
        status: form.status || undefined,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        notes: form.notes || undefined,
      };
      if (editingId) {
        await updateAdminPartner(editingId, payload);
      } else {
        await createAdminPartner(payload);
      }
      setEditorOpen(false);
      await load(search);
    } catch { setFormError('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    try {
      await deleteAdminPartner(id);
      setItems((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg.includes('assignments') ? 'Cannot delete: partner has active assignments.' : 'Failed to delete partner.');
    } finally { setConfirmId(null); }
  }

  function f(field: keyof PartnerForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const filtered = items.filter((p) =>
    !search || p.partnerName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="st-state">
      <Loader2 size={28} className="spin-icon" style={{ color: 'var(--color-primary-light)' }} />
    </div>
  );

  return (
    <div>
      {error && <div className="st-error">{error}</div>}

      <div className="st-toolbar">
        <div className="st-search-wrap">
          <Search size={14} className="st-search-icon" />
          <input
            className="st-search"
            placeholder="Search partners…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button className="st-add-btn" onClick={openCreate}>
          <Plus size={15} /> Add Partner
        </button>
      </div>

      <div className="st-table-wrap">
        <div className="st-table-scroll">
          <table className="st-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Email</th>
                <th>Region</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="st-empty-cell">No partners found.</td></tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td className="st-name">{p.partnerName}</td>
                  <td className="st-muted">{p.partnerType || '—'}</td>
                  <td className="st-muted">{p.contactName || '—'}</td>
                  <td className="st-muted">{p.email || '—'}</td>
                  <td className="st-muted">{p.region || '—'}</td>
                  <td>
                    <span className={`st-badge ${p.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}`}>
                      {p.status ?? 'Unknown'}
                    </span>
                  </td>
                  <td>
                    <ActionMenu onEdit={() => openEdit(p)} onDelete={() => setConfirmId(p.id)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editor panel */}
      {editorOpen && (
        <div className="st-panel-overlay" onClick={() => setEditorOpen(false)}>
          <div className="st-panel" onClick={(e) => e.stopPropagation()}>
            <div className="st-panel-header">
              <h3 className="st-panel-title">{editingId ? 'Edit Partner' : 'New Partner'}</h3>
              <button className="st-panel-close" onClick={() => setEditorOpen(false)}><X size={18} /></button>
            </div>
            <div className="st-panel-body">
              {formError && <div className="st-form-error">{formError}</div>}
              <div className="st-field-group">
                <label className="st-label">Organization Name *</label>
                <input className="st-input" value={form.partnerName} onChange={(e) => f('partnerName', e.target.value)} placeholder="Partner organization name" />
              </div>
              <div className="st-grid-2">
                <div className="st-field-group">
                  <label className="st-label">Partner Type</label>
                  <select className="st-select" value={form.partnerType} onChange={(e) => f('partnerType', e.target.value)}>
                    <option value="">Select…</option>
                    <option value="NGO">NGO</option>
                    <option value="Government">Government</option>
                    <option value="Academic">Academic</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Legal">Legal</option>
                    <option value="Community">Community</option>
                    <option value="Corporate">Corporate</option>
                    <option value="International">International</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="st-field-group">
                  <label className="st-label">Role / Focus Area</label>
                  <input className="st-input" value={form.roleType} onChange={(e) => f('roleType', e.target.value)} placeholder="e.g. Legal Aid, Counseling" />
                </div>
              </div>
              <div className="st-grid-2">
                <div className="st-field-group">
                  <label className="st-label">Contact Person</label>
                  <input className="st-input" value={form.contactName} onChange={(e) => f('contactName', e.target.value)} placeholder="Full name" />
                </div>
                <div className="st-field-group">
                  <label className="st-label">Email</label>
                  <input className="st-input" type="email" value={form.email} onChange={(e) => f('email', e.target.value)} placeholder="contact@org.org" />
                </div>
              </div>
              <div className="st-grid-2">
                <div className="st-field-group">
                  <label className="st-label">Phone</label>
                  <input className="st-input" value={form.phone} onChange={(e) => f('phone', e.target.value)} placeholder="+1 (555) 000-0000" />
                </div>
                <div className="st-field-group">
                  <label className="st-label">Region / Location</label>
                  <input className="st-input" value={form.region} onChange={(e) => f('region', e.target.value)} placeholder="City or region" />
                </div>
              </div>
              <div className="st-grid-3">
                <div className="st-field-group">
                  <label className="st-label">Status</label>
                  <select className="st-select" value={form.status} onChange={(e) => f('status', e.target.value)}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                <div className="st-field-group">
                  <label className="st-label">Start Date</label>
                  <input className="st-input" type="date" value={form.startDate} onChange={(e) => f('startDate', e.target.value)} />
                </div>
                <div className="st-field-group">
                  <label className="st-label">End Date</label>
                  <input className="st-input" type="date" value={form.endDate} onChange={(e) => f('endDate', e.target.value)} />
                </div>
              </div>
              <div className="st-field-group">
                <label className="st-label">Notes</label>
                <textarea className="st-textarea" value={form.notes} onChange={(e) => f('notes', e.target.value)} rows={3} placeholder="Additional notes about this partnership…" />
              </div>
            </div>
            <div className="st-panel-footer">
              <button className="st-cancel-btn" onClick={() => setEditorOpen(false)}>Cancel</button>
              <button className="st-save-btn" onClick={() => void handleSave()} disabled={saving}>
                {saving ? <Loader2 size={14} className="spin-icon" /> : <Save size={14} />}
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmId !== null && (
        <ConfirmDialog
          title="Delete Partner?"
          message="This will permanently remove the partner. Deletion is blocked if the partner has active resident assignments."
          onConfirm={() => void handleDelete(confirmId)}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  );
}

/* ===== Page ===== */
type SettingsTab = 'safehouses' | 'partners';

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('safehouses');

  return (
    <div>
      <div className="st-page-header">
        <h2 className="st-page-title">Settings</h2>
        <p className="st-page-subtitle">Manage safehouses and partner organizations</p>
      </div>

      <div className="st-tabs">
        <button
          className={`st-tab ${tab === 'safehouses' ? 'active' : ''}`}
          onClick={() => setTab('safehouses')}
        >
          <Home size={15} /> Safehouses
        </button>
        <button
          className={`st-tab ${tab === 'partners' ? 'active' : ''}`}
          onClick={() => setTab('partners')}
        >
          <Users size={15} /> Partners
        </button>
      </div>

      {tab === 'safehouses' && <SafehousesTab />}
      {tab === 'partners' && <PartnersTab />}
    </div>
  );
}
