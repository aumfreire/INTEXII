import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Home, MoreVertical, PencilLine, Plus, RefreshCw, Search, Trash2, Users, X } from 'lucide-react';
import AlertBanner from '../components/ui/AlertBanner';
import PrimaryButton from '../components/ui/PrimaryButton';
import SecondaryButton from '../components/ui/SecondaryButton';
import {
    createAdminSafehouse,
    deleteAdminSafehouse,
    getAdminSafehouses,
    updateAdminSafehouse,
    type SafehouseItem,
    type SafehouseUpsertRequest,
} from '../lib/authAPI';
import '../styles/pages/admin-users.css';

type SafehouseFormState = {
    safehouseCode: string;
    name: string;
    region: string;
    city: string;
    province: string;
    country: string;
    openDate: string;
    status: string;
    capacityGirls: string;
    capacityStaff: string;
    currentOccupancy: string;
    notes: string;
};

function emptyForm(): SafehouseFormState {
    return {
        safehouseCode: '',
        name: '',
        region: '',
        city: '',
        province: '',
        country: '',
        openDate: '',
        status: 'active',
        capacityGirls: '',
        capacityStaff: '',
        currentOccupancy: '',
        notes: '',
    };
}

function toForm(item: SafehouseItem): SafehouseFormState {
    return {
        safehouseCode: item.safehouseCode ?? '',
        name: item.name ?? '',
        region: item.region ?? '',
        city: item.city ?? '',
        province: item.province ?? '',
        country: item.country ?? '',
        openDate: item.openDate ?? '',
        status: item.status ?? 'active',
        capacityGirls: item.capacityGirls?.toString() ?? '',
        capacityStaff: item.capacityStaff?.toString() ?? '',
        currentOccupancy: item.currentOccupancy?.toString() ?? '',
        notes: item.notes ?? '',
    };
}

function toPayload(form: SafehouseFormState): SafehouseUpsertRequest {
    const parseNumber = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) return null;
        const parsed = Number(trimmed);
        return Number.isFinite(parsed) ? parsed : null;
    };

    return {
        safehouseCode: form.safehouseCode.trim() || null,
        name: form.name.trim() || null,
        region: form.region.trim() || null,
        city: form.city.trim() || null,
        province: form.province.trim() || null,
        country: form.country.trim() || null,
        openDate: form.openDate.trim() || null,
        status: form.status.trim() || null,
        capacityGirls: parseNumber(form.capacityGirls),
        capacityStaff: parseNumber(form.capacityStaff),
        currentOccupancy: parseNumber(form.currentOccupancy),
        notes: form.notes.trim() || null,
    };
}

function formatLocation(item: SafehouseItem): string {
    return [item.city, item.province, item.country].filter(Boolean).join(', ') || '—';
}

function formatDate(value: string | null): string {
    if (!value) return '—';
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function SafehouseActionMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
    const [open, setOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }

        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    return (
        <div ref={menuRef} style={{ position: 'relative', display: 'inline-flex' }}>
            <button
                type="button"
                className="au-badge donor"
                style={{ border: 'none', cursor: 'pointer', padding: '6px 8px' }}
                onClick={(event) => {
                    event.stopPropagation();
                    setOpen((value) => !value);
                }}
                aria-label="Safehouse actions"
            >
                <MoreVertical size={14} />
            </button>
            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        right: 0,
                        minWidth: '130px',
                        backgroundColor: 'var(--color-white)',
                        border: '1px solid var(--color-light-gray)',
                        borderRadius: 'var(--radius-sm)',
                        boxShadow: 'var(--shadow-md)',
                        zIndex: 30,
                        overflow: 'hidden',
                    }}
                >
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            setOpen(false);
                            onEdit();
                        }}
                        style={{ width: '100%', padding: '8px 10px', border: 'none', textAlign: 'left', background: 'transparent', cursor: 'pointer' }}
                    >
                        <PencilLine size={12} style={{ marginRight: '6px' }} /> Edit
                    </button>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            setOpen(false);
                            onDelete();
                        }}
                        style={{ width: '100%', padding: '8px 10px', border: 'none', textAlign: 'left', background: 'transparent', color: 'var(--color-primary-dark)', cursor: 'pointer' }}
                    >
                        <Trash2 size={12} style={{ marginRight: '6px' }} /> Delete
                    </button>
                </div>
            )}
        </div>
    );
}

export default function AdminSafehousesPage() {
    const pageSizeOptions = [10, 25, 50, 100];
    const [safehouses, setSafehouses] = useState<SafehouseItem[]>([]);
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [editorOpen, setEditorOpen] = useState(false);
    const [editorId, setEditorId] = useState<number | null>(null);
    const [editorForm, setEditorForm] = useState<SafehouseFormState>(emptyForm());
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    const loadSafehouses = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const items = await getAdminSafehouses();
            setSafehouses(items);
            if (items.length === 0) {
                setSelectedId(null);
            } else if (selectedId !== null && !items.some((item) => item.safehouseId === selectedId)) {
                setSelectedId(items[0].safehouseId);
            }
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to load safehouses.');
        } finally {
            setIsLoading(false);
        }
    }, [selectedId]);

    useEffect(() => {
        void loadSafehouses();
    }, [loadSafehouses]);

    const filteredSafehouses = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return safehouses;

        return safehouses.filter((item) => {
            return [
                item.safehouseCode,
                item.name,
                item.region,
                item.city,
                item.province,
                item.country,
                item.status,
            ]
                .filter(Boolean)
                .some((value) => value!.toLowerCase().includes(term));
        });
    }, [safehouses, search]);

    const selectedSafehouse = useMemo(
        () => safehouses.find((item) => item.safehouseId === selectedId) ?? null,
        [safehouses, selectedId]
    );

    const totalPages = Math.max(1, Math.ceil(filteredSafehouses.length / pageSize));
    const currentPage = Math.min(page, totalPages);
    const startIndex = (currentPage - 1) * pageSize;
    const pagedSafehouses = filteredSafehouses.slice(startIndex, startIndex + pageSize);

    const safehouseHasResidents = useCallback((item: SafehouseItem | null) => {
        return (item?.currentOccupancy ?? 0) > 0;
    }, []);

    useEffect(() => {
        setPage(1);
    }, [search]);

    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);

    function promptDelete(item: SafehouseItem | null) {
        if (!item) return;
        setDeleteId(item.safehouseId);
    }

    const metrics = useMemo(() => {
        const total = safehouses.length;
        const active = safehouses.filter((item) => (item.status ?? '').toLowerCase() === 'active').length;
        const occupied = safehouses.reduce((sum, item) => sum + (item.currentOccupancy ?? 0), 0);
        const capacity = safehouses.reduce((sum, item) => sum + (item.capacityGirls ?? 0), 0);
        return { total, active, occupied, capacity };
    }, [safehouses]);

    function openCreate() {
        setEditorId(null);
        setEditorForm(emptyForm());
        setEditorOpen(true);
        setErrorMessage('');
        setSuccessMessage('');
    }

    function openEdit(item: SafehouseItem) {
        setEditorId(item.safehouseId);
        setEditorForm(toForm(item));
        setEditorOpen(true);
        setErrorMessage('');
        setSuccessMessage('');
    }

    async function handleSave() {
        const missingFields: string[] = [];

        if (!editorForm.safehouseCode.trim()) {
            missingFields.push('Safehouse Code');
        }

        if (!editorForm.name.trim()) {
            missingFields.push('Name');
        }

        const parsedCapacityGirls = Number(editorForm.capacityGirls.trim());
        if (!editorForm.capacityGirls.trim() || !Number.isFinite(parsedCapacityGirls) || parsedCapacityGirls <= 0) {
            missingFields.push('Capacity Girls');
        }

        if (missingFields.length > 0) {
            setErrorMessage(`Please complete required fields: ${missingFields.join(', ')}.`);
            return;
        }

        setIsSaving(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const payload = toPayload(editorForm);
            if (editorId !== null) {
                await updateAdminSafehouse(editorId, payload);
                setSuccessMessage('Safehouse updated successfully.');
            } else {
                await createAdminSafehouse(payload);
                setSuccessMessage('Safehouse created successfully.');
            }

            setEditorOpen(false);
            setEditorId(null);
            setEditorForm(emptyForm());
            await loadSafehouses();
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to save safehouse.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (deleteId === null) return;

        const target = safehouses.find((item) => item.safehouseId === deleteId) ?? null;
        if (safehouseHasResidents(target)) {
            setDeleteId(null);
            setErrorMessage('This safehouse cannot be deleted while occupancy is above 0. Move residents out first.');
            return;
        }

        setIsSaving(true);
        setErrorMessage('');

        try {
            await deleteAdminSafehouse(deleteId);
            setDeleteId(null);
            if (selectedId === deleteId) {
                setSelectedId(null);
            }
            await loadSafehouses();
            setSuccessMessage('Safehouse deleted successfully.');
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to delete safehouse.');
        } finally {
            setIsSaving(false);
        }
    }

    const selectedOccupancy = selectedSafehouse && selectedSafehouse.capacityGirls ? Math.min((selectedSafehouse.currentOccupancy ?? 0) / selectedSafehouse.capacityGirls, 1) * 100 : 0;
    const deleteTarget = deleteId !== null
        ? safehouses.find((item) => item.safehouseId === deleteId) ?? null
        : null;
    const deleteBlocked = safehouseHasResidents(deleteTarget);

    return (
        <div>
            <div className="au-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                    <div className="admin-page-header">
                        <h1 className="admin-page-title">Safehouses</h1>
                        <p className="admin-page-subtitle">Create, update, and remove safehouse records.</p>
                    </div>
                </div>
                <PrimaryButton onClick={openCreate}>
                    <Plus size={16} /> Add Safehouse
                </PrimaryButton>
            </div>

            {(errorMessage || successMessage) && (
                <AlertBanner
                    type={errorMessage ? 'warning' : 'success'}
                    message={errorMessage || successMessage}
                    onClose={() => { setErrorMessage(''); setSuccessMessage(''); }}
                />
            )}

            <div className="au-summary">
                <div className="au-chip">
                    <div className="au-chip-icon default"><Building2 size={20} /></div>
                    <div><div className="au-chip-value">{metrics.total}</div><div className="au-chip-label">Safehouses</div></div>
                </div>
                <div className="au-chip">
                    <div className="au-chip-icon admin"><Users size={20} /></div>
                    <div><div className="au-chip-value">{metrics.active}</div><div className="au-chip-label">Active</div></div>
                </div>
                <div className="au-chip">
                    <div className="au-chip-icon money"><RefreshCw size={20} /></div>
                    <div><div className="au-chip-value">{metrics.capacity > 0 ? Math.round((metrics.occupied / metrics.capacity) * 100) : 0}%</div><div className="au-chip-label">Occupancy</div></div>
                </div>
            </div>

            <div className="au-filters" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '12px', flexWrap: 'nowrap' }}>
                <div className="au-search-wrap" style={{ flex: '1 1 340px', minWidth: '240px' }}>
                    <Search size={16} className="au-search-icon" />
                    <input
                        className="au-filter-input"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search safehouses, locations, or status"
                    />
                </div>
                <div className="au-filter-actions" style={{ display: 'flex', alignItems: 'center', flexWrap: 'nowrap', gap: '10px' }}>
                    <label className="au-filter-label" htmlFor="safehouse-page-size" style={{ marginBottom: 0 }}>Display</label>
                    <select
                        id="safehouse-page-size"
                        className="au-filter-select"
                        value={pageSize}
                        onChange={(event) => {
                            setPageSize(Number(event.target.value));
                            setPage(1);
                        }}
                        style={{ width: '96px', minWidth: '96px' }}
                    >
                        {pageSizeOptions.map((size) => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                    <SecondaryButton onClick={() => void loadSafehouses()} disabled={isLoading}>
                        <RefreshCw size={16} /> Refresh
                    </SecondaryButton>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '20px', alignItems: 'start' }}>
                <div className="au-table-wrap">
                    {isLoading ? (
                        <div className="au-empty">Loading safehouses...</div>
                    ) : filteredSafehouses.length === 0 ? (
                        <div className="au-empty">No safehouses match your search.</div>
                    ) : (
                        <div className="au-table-scroll">
                            <table className="au-table">
                                <thead>
                                    <tr>
                                        <th>Safehouse</th>
                                        <th>Location</th>
                                        <th>Occupancy</th>
                                        <th>Status</th>
                                        <th style={{ width: '90px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagedSafehouses.map((item) => {
                                        const selected = item.safehouseId === selectedId;
                                        const occupancy = item.capacityGirls && item.capacityGirls > 0
                                            ? `${item.currentOccupancy ?? 0}/${item.capacityGirls}`
                                            : `${item.currentOccupancy ?? 0}/—`;

                                        return (
                                            <tr key={item.safehouseId} className={selected ? 'active' : ''} onClick={() => setSelectedId(item.safehouseId)} style={{ cursor: 'pointer' }}>
                                                <td>
                                                    <div className="au-user-name">{item.name ?? `Safehouse #${item.safehouseId}`}</div>
                                                    <div className="au-user-email">{item.safehouseCode ?? `ID ${item.safehouseId}`}</div>
                                                </td>
                                                <td>{formatLocation(item)}</td>
                                                <td>{occupancy}</td>
                                                <td>
                                                    <span className="au-badge donor" style={{ backgroundColor: (item.status ?? '').toLowerCase() === 'active' ? 'rgba(122, 158, 126, 0.12)' : 'rgba(193, 96, 58, 0.1)', color: (item.status ?? '').toLowerCase() === 'active' ? 'var(--color-sage)' : 'var(--color-primary)' }}>
                                                        {item.status ?? '—'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                                        <SafehouseActionMenu
                                                            onEdit={() => openEdit(item)}
                                                            onDelete={() => promptDelete(item)}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            <div className="au-table-footer">
                                <span>
                                    Showing {filteredSafehouses.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, filteredSafehouses.length)} of {filteredSafehouses.length}
                                </span>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button className="au-danger-btn" type="button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>Prev</button>
                                    <span style={{ color: 'var(--color-muted)', fontSize: '0.88rem' }}>Page {currentPage} of {totalPages}</span>
                                    <button className="au-danger-btn" type="button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>Next</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="au-table-wrap" style={{ padding: '24px' }}>
                    {selectedSafehouse ? (
                        <>
                            <div className="au-header" style={{ marginBottom: '18px' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontFamily: 'var(--font-heading)', color: 'var(--color-dark)' }}>{selectedSafehouse.name ?? `Safehouse #${selectedSafehouse.safehouseId}`}</h2>
                                    <p style={{ margin: '6px 0 0', color: 'var(--color-muted)' }}>{selectedSafehouse.safehouseCode ?? `ID ${selectedSafehouse.safehouseId}`}</p>
                                </div>
                                <SecondaryButton onClick={() => openEdit(selectedSafehouse)}>
                                    <PencilLine size={16} /> Edit
                                </SecondaryButton>
                            </div>

                            <div className="au-summary" style={{ marginBottom: '18px' }}>
                                <div className="au-chip">
                                    <div className="au-chip-icon default"><Home size={18} /></div>
                                    <div><div className="au-chip-value">{selectedSafehouse.currentOccupancy ?? 0}</div><div className="au-chip-label">Residents</div></div>
                                </div>
                                <div className="au-chip">
                                    <div className="au-chip-icon admin"><Users size={18} /></div>
                                    <div><div className="au-chip-value">{selectedSafehouse.capacityGirls ?? '—'}</div><div className="au-chip-label">Girls Capacity</div></div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: '14px' }}>
                                <div>
                                    <div className="au-chip-label">Location</div>
                                    <div style={{ color: 'var(--color-dark)' }}>{formatLocation(selectedSafehouse)}</div>
                                </div>
                                <div>
                                    <div className="au-chip-label">Open Date</div>
                                    <div style={{ color: 'var(--color-dark)' }}>{formatDate(selectedSafehouse.openDate)}</div>
                                </div>
                                <div>
                                    <div className="au-chip-label">Occupancy</div>
                                    <div style={{ marginTop: '6px', height: '10px', background: 'var(--color-cream)', borderRadius: '999px', overflow: 'hidden' }}>
                                        <div style={{ width: `${selectedOccupancy}%`, height: '100%', background: 'var(--color-primary)', borderRadius: '999px' }} />
                                    </div>
                                    <div style={{ marginTop: '6px', color: 'var(--color-muted)' }}>{selectedSafehouse.currentOccupancy ?? 0}/{selectedSafehouse.capacityGirls ?? '—'}</div>
                                </div>
                                <div>
                                    <div className="au-chip-label">Notes</div>
                                    <div style={{ color: 'var(--color-dark)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selectedSafehouse.notes || '—'}</div>
                                </div>
                            </div>

                            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                <SecondaryButton onClick={() => promptDelete(selectedSafehouse)}>
                                    <Trash2 size={16} /> Delete
                                </SecondaryButton>
                            </div>
                            <p style={{ margin: '10px 0 0', fontSize: '0.82rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                                Safehouses can only be deleted when occupancy = 0.
                            </p>
                        </>
                    ) : (
                        <div className="au-empty">Select a safehouse to view details.</div>
                    )}
                </div>
            </div>

            {editorOpen && (
                <div className="au-modal-overlay" onClick={() => { setEditorOpen(false); setEditorId(null); setEditorForm(emptyForm()); }}>
                    <div className="au-modal large" onClick={(event) => event.stopPropagation()}>
                        <div className="au-modal-header">
                            <h3>{editorId ? 'Edit Safehouse' : 'Add Safehouse'}</h3>
                            <button className="au-close" aria-label="Close" onClick={() => { setEditorOpen(false); setEditorId(null); setEditorForm(emptyForm()); }}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="au-modal-body">
                            {errorMessage ? (
                                <AlertBanner type="warning" message={errorMessage} onClose={() => setErrorMessage('')} />
                            ) : null}
                            <div className="donors-detail-grid">
                                <div>
                                    <div className="donors-history-list">
                                        <label className="au-filter-label">Safehouse Code *</label>
                                        <input className="au-filter-input" value={editorForm.safehouseCode} onChange={(event) => setEditorForm((value) => ({ ...value, safehouseCode: event.target.value }))} />
                                        <label className="au-filter-label">Name *</label>
                                        <input className="au-filter-input" value={editorForm.name} onChange={(event) => setEditorForm((value) => ({ ...value, name: event.target.value }))} />
                                        <label className="au-filter-label">Region</label>
                                        <input className="au-filter-input" value={editorForm.region} onChange={(event) => setEditorForm((value) => ({ ...value, region: event.target.value }))} />
                                        <label className="au-filter-label">City</label>
                                        <input className="au-filter-input" value={editorForm.city} onChange={(event) => setEditorForm((value) => ({ ...value, city: event.target.value }))} />
                                        <label className="au-filter-label">Province</label>
                                        <input className="au-filter-input" value={editorForm.province} onChange={(event) => setEditorForm((value) => ({ ...value, province: event.target.value }))} />
                                        <label className="au-filter-label">Country</label>
                                        <input className="au-filter-input" value={editorForm.country} onChange={(event) => setEditorForm((value) => ({ ...value, country: event.target.value }))} />
                                    </div>
                                </div>
                                <div>
                                    <div className="donors-history-list">
                                        <label className="au-filter-label">Status</label>
                                        <select className="au-filter-select" value={editorForm.status} onChange={(event) => setEditorForm((value) => ({ ...value, status: event.target.value }))}>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="maintenance">Maintenance</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                        <label className="au-filter-label">Open Date</label>
                                        <input type="date" className="au-filter-input" value={editorForm.openDate} onChange={(event) => setEditorForm((value) => ({ ...value, openDate: event.target.value }))} />
                                        <label className="au-filter-label">Capacity Girls *</label>
                                        <input type="number" className="au-filter-input" value={editorForm.capacityGirls} onChange={(event) => setEditorForm((value) => ({ ...value, capacityGirls: event.target.value }))} />
                                        <label className="au-filter-label">Capacity Staff</label>
                                        <input type="number" className="au-filter-input" value={editorForm.capacityStaff} onChange={(event) => setEditorForm((value) => ({ ...value, capacityStaff: event.target.value }))} />
                                        <label className="au-filter-label">Current Occupancy</label>
                                        <input type="number" className="au-filter-input" value={editorForm.currentOccupancy} onChange={(event) => setEditorForm((value) => ({ ...value, currentOccupancy: event.target.value }))} />
                                        <label className="au-filter-label">Notes</label>
                                        <textarea className="au-filter-input" rows={4} value={editorForm.notes} onChange={(event) => setEditorForm((value) => ({ ...value, notes: event.target.value }))} />
                                        <p style={{ margin: '8px 0 0', fontSize: '0.82rem', color: 'var(--color-muted)' }}>
                                            * Required fields: Safehouse Code, Name, and Capacity Girls.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="au-modal-footer">
                            <SecondaryButton onClick={() => { setEditorOpen(false); setEditorId(null); setEditorForm(emptyForm()); }}>
                                Cancel
                            </SecondaryButton>
                            <PrimaryButton onClick={() => { void handleSave(); }} disabled={isSaving}>
                                {isSaving ? 'Saving...' : editorId ? 'Update Safehouse' : 'Create Safehouse'}
                            </PrimaryButton>
                        </div>
                    </div>
                </div>
            )}

            {deleteId !== null && (
                <div className="au-modal-overlay">
                    <div className="au-modal" style={{ maxWidth: '520px' }}>
                        <div className="au-modal-header">
                            <h3>Delete Safehouse</h3>
                            <button className="au-close" aria-label="Close" onClick={() => setDeleteId(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="au-modal-body">
                            {errorMessage ? (
                                <AlertBanner type="warning" message={errorMessage} onClose={() => setErrorMessage('')} />
                            ) : null}
                            {deleteBlocked
                                ? 'This safehouse cannot be deleted because occupancy is above 0. Move all residents out first.'
                                : 'Are you sure you want to delete this safehouse? This action cannot be undone.'}
                            <div style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
                                Safehouses can only be deleted when occupancy = 0.
                            </div>
                        </div>
                        <div className="au-modal-footer">
                            <SecondaryButton onClick={() => setDeleteId(null)}>
                                Cancel
                            </SecondaryButton>
                            {!deleteBlocked && (
                                <PrimaryButton onClick={() => { void handleDelete(); }} disabled={isSaving}>
                                    {isSaving ? 'Deleting...' : 'Delete Safehouse'}
                                </PrimaryButton>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}