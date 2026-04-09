import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Edit3, Plus, Search, XCircle } from 'lucide-react';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import AlertBanner from '../components/ui/AlertBanner';
import {
    closeAdminIncidentReport,
    createAdminIncidentReport,
    getAdminIncidentReports,
    getAdminResidentOptions,
    getAdminSafehouses,
    updateAdminIncidentReport,
    type IncidentReportListItem,
    type IncidentReportUpsertRequest,
    type ResidentOption,
    type SafehouseItem,
} from '../lib/authAPI';
import '../styles/pages/incidents.css';

type IncidentFormState = {
    residentId: string;
    safehouseId: string;
    incidentDate: string;
    incidentType: string;
    severity: string;
    description: string;
    responseTaken: string;
    resolved: boolean;
    resolutionDate: string;
    reportedBy: string;
    followUpRequired: boolean;
};

const emptyForm: IncidentFormState = {
    residentId: '',
    safehouseId: '',
    incidentDate: '',
    incidentType: '',
    severity: 'Moderate',
    description: '',
    responseTaken: '',
    resolved: false,
    resolutionDate: '',
    reportedBy: '',
    followUpRequired: true,
};

function toPayload(form: IncidentFormState): IncidentReportUpsertRequest {
    return {
        residentId: form.residentId ? Number(form.residentId) : null,
        safehouseId: form.safehouseId ? Number(form.safehouseId) : null,
        incidentDate: form.incidentDate || null,
        incidentType: form.incidentType.trim() || null,
        severity: form.severity.trim() || null,
        description: form.description.trim() || null,
        responseTaken: form.responseTaken.trim() || null,
        resolved: form.resolved,
        resolutionDate: form.resolutionDate || null,
        reportedBy: form.reportedBy.trim() || null,
        followUpRequired: form.followUpRequired,
    };
}

export default function IncidentReportsPage() {
    const [items, setItems] = useState<IncidentReportListItem[]>([]);
    const [residents, setResidents] = useState<ResidentOption[]>([]);
    const [safehouses, setSafehouses] = useState<SafehouseItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [severity, setSeverity] = useState('');
    const [resolved, setResolved] = useState<'all' | 'open' | 'resolved'>('all');
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [form, setForm] = useState<IncidentFormState>(emptyForm);

    useEffect(() => {
        void Promise.all([loadIncidents(), loadLookups()]);
    }, []);

    async function loadLookups() {
        try {
            const [residentOptions, safehouseOptions] = await Promise.all([
                getAdminResidentOptions(),
                getAdminSafehouses(),
            ]);
            setResidents(residentOptions);
            setSafehouses(safehouseOptions);
        } catch {
            // Non-blocking for list view
        }
    }

    async function loadIncidents() {
        setIsLoading(true);
        setError('');
        try {
            const data = await getAdminIncidentReports({
                search: search.trim() || undefined,
                severity: severity || undefined,
                resolved: resolved === 'all' ? undefined : resolved === 'resolved',
                page: 1,
                pageSize: 100,
            });
            setItems(data.items);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unable to load incident reports.');
        } finally {
            setIsLoading(false);
        }
    }

    const safehouseNameById = useMemo(() => {
        const map = new Map<number, string>();
        safehouses.forEach((s) => map.set(s.safehouseId, s.name ?? `Safehouse ${s.safehouseId}`));
        return map;
    }, [safehouses]);

    function openCreate() {
        setEditingId(null);
        setForm(emptyForm);
        setEditorOpen(true);
    }

    function openEdit(item: IncidentReportListItem) {
        setEditingId(item.id);
        setForm({
            residentId: item.residentId ? String(item.residentId) : '',
            safehouseId: item.safehouseId ? String(item.safehouseId) : '',
            incidentDate: item.incidentDate ?? '',
            incidentType: item.incidentType ?? '',
            severity: item.severity ?? 'Moderate',
            description: '',
            responseTaken: '',
            resolved: item.resolved,
            resolutionDate: '',
            reportedBy: item.reportedBy ?? '',
            followUpRequired: item.followUpRequired,
        });
        setEditorOpen(true);
    }

    async function saveIncident() {
        if (!form.incidentDate) {
            setError('Incident date is required.');
            return;
        }
        if (!form.incidentType.trim()) {
            setError('Incident type is required.');
            return;
        }

        setIsSaving(true);
        setError('');
        try {
            const payload = toPayload(form);
            if (editingId) {
                await updateAdminIncidentReport(editingId, payload);
            } else {
                await createAdminIncidentReport(payload);
            }
            setEditorOpen(false);
            await loadIncidents();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unable to save incident report.');
        } finally {
            setIsSaving(false);
        }
    }

    async function closeIncident(id: number) {
        try {
            await closeAdminIncidentReport(id);
            await loadIncidents();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unable to close incident report.');
        }
    }

    return (
        <div>
            <div className="admin-page-header">
                <h1 className="admin-page-title">Incident Reports</h1>
                <p className="admin-page-subtitle">Track safety and behavioral incidents with follow-up visibility.</p>
            </div>

            {error && <AlertBanner type="warning" message={error} />}

            <div className="ir-toolbar">
                <div className="ir-filters">
                    <div className="ir-search-wrap">
                        <Search size={14} className="ir-search-icon" />
                        <input
                            className="ir-input"
                            placeholder="Search incident type, reporter, resident..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && void loadIncidents()}
                        />
                    </div>
                    <select className="ir-input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                        <option value="">All Severities</option>
                        <option value="Low">Low</option>
                        <option value="Moderate">Moderate</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                    </select>
                    <select className="ir-input" value={resolved} onChange={(e) => setResolved(e.target.value as typeof resolved)}>
                        <option value="all">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="resolved">Resolved</option>
                    </select>
                    <SecondaryButton onClick={() => void loadIncidents()}>Apply</SecondaryButton>
                </div>
                <PrimaryButton onClick={openCreate}><Plus size={16} /> New Incident</PrimaryButton>
            </div>

            <div className="ir-table-wrap">
                <table className="ir-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Resident</th>
                            <th>Safehouse</th>
                            <th>Type</th>
                            <th>Severity</th>
                            <th>Reporter</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {!isLoading && items.length === 0 && (
                            <tr>
                                <td colSpan={8} className="ir-empty">No incident reports found.</td>
                            </tr>
                        )}
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td>{item.incidentDate || '—'}</td>
                                <td>
                                    {item.residentId ? (
                                        <Link to={`/admin/residents/${item.residentId}`} className="ir-resident-link" style={{ textDecoration: 'none' }}>
                                            {item.residentName}
                                        </Link>
                                    ) : (
                                        item.residentName
                                    )}
                                </td>
                                <td>{item.safehouseName || (item.safehouseId ? safehouseNameById.get(item.safehouseId) : '—')}</td>
                                <td>{item.incidentType || '—'}</td>
                                <td>{item.severity || '—'}</td>
                                <td>{item.reportedBy || '—'}</td>
                                <td>
                                    <span className={`ir-badge ${item.resolved ? 'resolved' : 'open'}`}>
                                        {item.resolved ? 'Resolved' : 'Open'}
                                    </span>
                                </td>
                                <td className="ir-actions">
                                    <button className="ir-action-btn" onClick={() => openEdit(item)} title="Edit">
                                        <Edit3 size={14} />
                                    </button>
                                    {!item.resolved && (
                                        <button className="ir-action-btn close" onClick={() => void closeIncident(item.id)} title="Close incident">
                                            <XCircle size={14} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {editorOpen && (
                <div className="ir-overlay" onClick={() => setEditorOpen(false)}>
                    <div className="ir-panel" onClick={(e) => e.stopPropagation()}>
                        <div className="ir-panel-header">
                            <h3>{editingId ? 'Edit Incident' : 'New Incident'}</h3>
                        </div>

                        <div className="ir-panel-body">
                            <div className="ir-grid">
                                <label>
                                    Incident Date *
                                    <input type="date" className="ir-input" value={form.incidentDate} onChange={(e) => setForm((v) => ({ ...v, incidentDate: e.target.value }))} />
                                </label>
                                <label>
                                    Incident Type *
                                    <input className="ir-input" value={form.incidentType} onChange={(e) => setForm((v) => ({ ...v, incidentType: e.target.value }))} />
                                </label>
                                <label>
                                    Severity
                                    <select className="ir-input" value={form.severity} onChange={(e) => setForm((v) => ({ ...v, severity: e.target.value }))}>
                                        <option value="Low">Low</option>
                                        <option value="Moderate">Moderate</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </label>
                                <label>
                                    Reported By
                                    <input className="ir-input" value={form.reportedBy} onChange={(e) => setForm((v) => ({ ...v, reportedBy: e.target.value }))} />
                                </label>
                                <label>
                                    Resident
                                    <select className="ir-input" value={form.residentId} onChange={(e) => setForm((v) => ({ ...v, residentId: e.target.value }))}>
                                        <option value="">Unassigned</option>
                                        {residents.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </label>
                                <label>
                                    Safehouse
                                    <select className="ir-input" value={form.safehouseId} onChange={(e) => setForm((v) => ({ ...v, safehouseId: e.target.value }))}>
                                        <option value="">Unassigned</option>
                                        {safehouses.map((s) => <option key={s.safehouseId} value={s.safehouseId}>{s.name ?? `Safehouse ${s.safehouseId}`}</option>)}
                                    </select>
                                </label>
                            </div>

                            <label>
                                Description
                                <textarea className="ir-textarea" rows={4} value={form.description} onChange={(e) => setForm((v) => ({ ...v, description: e.target.value }))} />
                            </label>
                            <label>
                                Response Taken
                                <textarea className="ir-textarea" rows={3} value={form.responseTaken} onChange={(e) => setForm((v) => ({ ...v, responseTaken: e.target.value }))} />
                            </label>

                            <div className="ir-grid">
                                <label className="ir-checkbox">
                                    <input type="checkbox" checked={form.followUpRequired} onChange={(e) => setForm((v) => ({ ...v, followUpRequired: e.target.checked }))} />
                                    Follow-up required
                                </label>
                                <label className="ir-checkbox">
                                    <input type="checkbox" checked={form.resolved} onChange={(e) => setForm((v) => ({ ...v, resolved: e.target.checked }))} />
                                    Mark as resolved
                                </label>
                                {form.resolved && (
                                    <label>
                                        Resolution Date
                                        <input type="date" className="ir-input" value={form.resolutionDate} onChange={(e) => setForm((v) => ({ ...v, resolutionDate: e.target.value }))} />
                                    </label>
                                )}
                            </div>
                        </div>

                        <div className="ir-panel-footer">
                            <SecondaryButton onClick={() => setEditorOpen(false)}>Cancel</SecondaryButton>
                            <PrimaryButton onClick={() => void saveIncident()} disabled={isSaving}>
                                <AlertTriangle size={14} />
                                {isSaving ? 'Saving...' : 'Save Incident'}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
