import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, DollarSign, Gift, PencilLine, Plus, RefreshCw, Search, Trash2, Users } from 'lucide-react';
import AlertBanner from '../components/ui/AlertBanner';
import PrimaryButton from '../components/ui/PrimaryButton';
import { formatMoney } from '../lib/formatters';
import { createDonation, deleteDonation, getAdminDonationSummary, getAdminDonations, getDonationSupporters, updateDonation } from '../lib/authAPI';
import type { DonationRecord, PagedDonationResponse } from '../types/DonationTypes';
import type { AdminDonationSummary } from '../types/AdminUser';
import type { DonationSupporterOption, DonationUpsertRequest } from '../types/AdminDonation';

type DonationFormState = {
    supporterId: string;
    supporterEmail: string;
    supporterFirstName: string;
    supporterLastName: string;
    supporterDisplayName: string;
    supporterOrganizationName: string;
    supporterType: string;
    supporterStatus: string;
    donationType: string;
    donationDate: string;
    isRecurring: boolean;
    campaignName: string;
    channelSource: string;
    currencyCode: string;
    amount: string;
    estimatedValue: string;
    impactUnit: string;
    notes: string;
    referralPostId: string;
};

const pageSizes = [10, 25, 50, 100];
const supporterTypeOptions = ['Individual', 'Organization', 'Foundation', 'Family', 'Anonymous', 'Other'];
const supporterStatusOptions = ['Active', 'Prospect', 'Inactive', 'Lapsed', 'Archived'];
const donationTypeOptions = ['Cash', 'In-kind', 'Pledge', 'Recurring', 'Matching', 'Campaign', 'Grant', 'Other'];
const currencyOptions = ['USD', 'CAD', 'EUR', 'GBP', 'AUD', 'MXN'];

function createEmptyForm(supporterId = ''): DonationFormState {
    return {
        supporterId,
        supporterEmail: '',
        supporterFirstName: '',
        supporterLastName: '',
        supporterDisplayName: '',
        supporterOrganizationName: '',
        supporterType: 'Individual',
        supporterStatus: 'Active',
        donationType: '',
        donationDate: '',
        isRecurring: false,
        campaignName: '',
        channelSource: '',
        currencyCode: 'USD',
        amount: '',
        estimatedValue: '',
        impactUnit: '',
        notes: '',
        referralPostId: '',
    };
}

function mapDonationToForm(donation: DonationRecord): DonationFormState {
    return {
        supporterId: donation.supporterId?.toString() ?? '',
        supporterEmail: donation.supporterEmail ?? '',
        supporterFirstName: '',
        supporterLastName: '',
        supporterDisplayName: donation.supporterDisplayName ?? '',
        supporterOrganizationName: '',
        supporterType: 'Individual',
        supporterStatus: 'Active',
        donationType: donation.donationType ?? '',
        donationDate: donation.donationDate ?? '',
        isRecurring: Boolean(donation.isRecurring),
        campaignName: donation.campaignName ?? '',
        channelSource: donation.channelSource ?? '',
        currencyCode: donation.currencyCode ?? 'USD',
        amount: donation.amount?.toString() ?? '',
        estimatedValue: donation.estimatedValue?.toString() ?? '',
        impactUnit: donation.impactUnit ?? '',
        notes: donation.notes ?? '',
        referralPostId: donation.referralPostId?.toString() ?? '',
    };
}

function toRequestPayload(form: DonationFormState): DonationUpsertRequest {
    const parsedSupporterId = form.supporterId.trim().length > 0 ? Number(form.supporterId) : null;
    const parsedReferralPostId = form.referralPostId.trim().length > 0 ? Number(form.referralPostId) : null;
    const parsedAmount = form.amount.trim().length > 0 ? Number(form.amount) : null;
    const parsedEstimatedValue = form.estimatedValue.trim().length > 0 ? Number(form.estimatedValue) : null;

    return {
        supporterId: Number.isFinite(parsedSupporterId ?? NaN) ? parsedSupporterId : null,
        supporterEmail: form.supporterEmail.trim() || null,
        supporterFirstName: form.supporterFirstName.trim() || null,
        supporterLastName: form.supporterLastName.trim() || null,
        supporterDisplayName: form.supporterDisplayName.trim() || null,
        supporterOrganizationName: form.supporterOrganizationName.trim() || null,
        supporterType: form.supporterType.trim() || null,
        supporterStatus: form.supporterStatus.trim() || null,
        donationType: form.donationType.trim() || null,
        donationDate: form.donationDate.trim() || null,
        isRecurring: form.isRecurring,
        campaignName: form.campaignName.trim() || null,
        channelSource: form.channelSource.trim() || null,
        currencyCode: form.currencyCode.trim() || 'USD',
        amount: Number.isFinite(parsedAmount ?? NaN) ? parsedAmount : null,
        estimatedValue: Number.isFinite(parsedEstimatedValue ?? NaN) ? parsedEstimatedValue : null,
        impactUnit: form.impactUnit.trim() || null,
        notes: form.notes.trim() || null,
        referralPostId: Number.isFinite(parsedReferralPostId ?? NaN) ? parsedReferralPostId : null,
    };
}

function formatSummaryMoney(value: number | null | undefined): string {
    return typeof value === 'number' ? formatMoney(value) : '-';
}

export default function AdminDonationsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const supporterFilterId = searchParams.get('supporterId');
    const supporterFilterLabel = searchParams.get('supporterName');

    const [summary, setSummary] = useState<AdminDonationSummary | null>(null);
    const [response, setResponse] = useState<PagedDonationResponse<DonationRecord> | null>(null);
    const [supporterOptions, setSupporterOptions] = useState<DonationSupporterOption[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(25);
    const [page, setPage] = useState(1);
    const [supporterLookupTerm, setSupporterLookupTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showEditor, setShowEditor] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editingDonation, setEditingDonation] = useState<DonationRecord | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<DonationRecord | null>(null);
    const [form, setForm] = useState<DonationFormState>(createEmptyForm(supporterFilterId ?? ''));

    const currentPage = response?.totalPages ? Math.min(page, response.totalPages) : 0;
    const donations = response?.items ?? [];
    const totalCount = response?.totalCount ?? 0;
    const totalPages = response?.totalPages ?? 0;
    const startIndex = currentPage === 0 ? 0 : (currentPage - 1) * pageSize;

    const loadSummary = useCallback(async () => {
        try {
            setSummary(await getAdminDonationSummary());
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to load donation summary.');
        }
    }, []);

    const loadDonations = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            setResponse(
                await getAdminDonations({
                    page,
                    pageSize,
                    search: searchTerm,
                    supporterId: supporterFilterId ?? undefined,
                })
            );
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to load donations.');
        } finally {
            setIsLoading(false);
        }
    }, [page, pageSize, searchTerm, supporterFilterId]);

    const loadSupporters = useCallback(async () => {
        try {
            setSupporterOptions(await getDonationSupporters(supporterLookupTerm));
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to load supporter options.');
        }
    }, [supporterLookupTerm]);

    useEffect(() => {
        void loadSummary();
    }, [loadSummary]);

    useEffect(() => {
        void loadDonations();
    }, [loadDonations]);

    useEffect(() => {
        if (showEditor) {
            void loadSupporters();
        }
    }, [loadSupporters, showEditor]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, searchTerm, supporterFilterId]);

    useEffect(() => {
        setForm(createEmptyForm(supporterFilterId ?? ''));
    }, [supporterFilterId]);

    const supporterOptionsById = useMemo(() => new Map(supporterOptions.map((supporter) => [supporter.supporterId.toString(), supporter])), [supporterOptions]);

    function openCreateModal() {
        setEditingDonation(null);
        setForm(createEmptyForm(supporterFilterId ?? ''));
        setSupporterLookupTerm('');
        setShowEditor(true);
        setErrorMessage('');
        setSuccessMessage('');
    }

    function openEditModal(donation: DonationRecord) {
        setEditingDonation(donation);
        setForm(mapDonationToForm(donation));
        setSupporterLookupTerm('');
        setShowEditor(true);
        setErrorMessage('');
        setSuccessMessage('');
    }

    function closeEditor() {
        setShowEditor(false);
        setEditingDonation(null);
        setSupporterLookupTerm('');
    }

    function closeDeleteConfirm() {
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
    }

    async function handleSaveDonation() {
        if (!form.supporterId.trim() && !form.supporterEmail.trim()) {
            setErrorMessage('Choose an existing supporter or enter a supporter email.');
            return;
        }

        if (!form.amount.trim()) {
            setErrorMessage('Donation amount is required.');
            return;
        }

        setIsSaving(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const savedDonation = editingDonation
                ? await updateDonation(editingDonation.donationId, toRequestPayload(form))
                : await createDonation(toRequestPayload(form));

            setSuccessMessage(editingDonation ? `Donation ${savedDonation.donationId} updated successfully.` : `Donation ${savedDonation.donationId} created successfully.`);
            closeEditor();
            await Promise.all([loadDonations(), loadSummary()]);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to save the donation.');
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDeleteDonation() {
        if (!deleteTarget) {
            return;
        }

        setIsSaving(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            await deleteDonation(deleteTarget.donationId);
            setSuccessMessage(`Donation ${deleteTarget.donationId} deleted successfully.`);
            closeDeleteConfirm();
            await Promise.all([loadDonations(), loadSummary()]);
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : 'Unable to delete the donation.');
        } finally {
            setIsSaving(false);
        }
    }

    const selectedSupporter = form.supporterId ? supporterOptionsById.get(form.supporterId) ?? null : null;
    const hasExplicitSupporter = form.supporterId.trim().length > 0;

    return (
        <div>
            <div className="donors-header">
                <div className="admin-page-header">
                    <h1 className="admin-page-title">Supporters &amp; Contributions</h1>
                    <p className="admin-page-subtitle">Review, create, update, and remove donation records.</p>
                    <div style={{ marginTop: '10px' }}>
                        <Link to="/admin" className="dash-panel-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <ChevronLeft size={14} />
                            Back to Admin Dashboard
                        </Link>
                    </div>
                </div>
                <div className="donors-header-actions">
                    <PrimaryButton onClick={openCreateModal}>
                        <Plus size={16} />
                        Add Donation
                    </PrimaryButton>
                </div>
            </div>

            {supporterFilterId ? (
                <div className="donors-filters" style={{ marginBottom: '24px' }}>
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            Showing donations for supporter ID {supporterFilterId}
                            {supporterFilterLabel ? ` (${supporterFilterLabel})` : ''}.
                        </div>
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => {
                                const nextParams = new URLSearchParams(searchParams);
                                nextParams.delete('supporterId');
                                nextParams.delete('supporterName');
                                setSearchParams(nextParams);
                            }}
                        >
                            Clear filter
                        </button>
                    </div>
                </div>
            ) : null}

            {errorMessage ? <AlertBanner message={errorMessage} type="warning" onClose={() => setErrorMessage('')} /> : null}
            {successMessage ? <AlertBanner message={successMessage} type="success" onClose={() => setSuccessMessage('')} /> : null}

            <div className="donors-summary">
                <div className="donors-chip"><div className="donors-chip-icon supporters"><Users size={20} /></div><div><div className="donors-chip-value">{summary?.totalDonationCount ?? '-'}</div><div className="donors-chip-label">Total Donations</div></div></div>
                <div className="donors-chip"><div className="donors-chip-icon monthly"><DollarSign size={20} /></div><div><div className="donors-chip-value">{formatSummaryMoney(summary?.totalMonetaryAmount)}</div><div className="donors-chip-label">Monetary Total</div></div></div>
                <div className="donors-chip"><div className="donors-chip-icon inkind"><Gift size={20} /></div><div><div className="donors-chip-value">{formatSummaryMoney(summary?.totalEstimatedValue)}</div><div className="donors-chip-label">Estimated Value</div></div></div>
                <div className="donors-chip"><div className="donors-chip-icon recurring"><RefreshCw size={20} /></div><div><div className="donors-chip-value">{summary?.latestDonationDate ?? '-'}</div><div className="donors-chip-label">Latest Donation</div></div></div>
            </div>

            <div className="donors-filters">
                <div className="donors-filters-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
                    <div className="donors-filter-group">
                        <label className="donors-filter-label" htmlFor="admin-donation-search">Search</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
                            <input
                                id="admin-donation-search"
                                type="text"
                                className="donors-filter-input"
                                placeholder="Supporter, campaign, type, note, or channel..."
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                style={{ paddingLeft: '36px' }}
                            />
                        </div>
                    </div>
                    <div className="donors-filter-group">
                        <label className="donors-filter-label" htmlFor="admin-donation-page-size">Display</label>
                        <select id="admin-donation-page-size" className="donors-filter-select" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                            {pageSizes.map((size) => <option key={size} value={size}>{size}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            <div className="donors-table-wrap">
                <div className="donors-table-scroll">
                    <table className="donors-table">
                        <thead>
                            <tr>
                                <th style={{ minWidth: '180px' }}>Supporter</th>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Type</th>
                                <th>Campaign</th>
                                <th>Channel</th>
                                <th>Notes</th>
                                <th style={{ width: '210px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr><td colSpan={8} className="text-center py-5 text-muted">Loading donations...</td></tr>
                            ) : donations.length > 0 ? (
                                donations.map((donation) => (
                                    <tr key={donation.donationId}>
                                        <td>
                                            <div className="donors-supporter-name">{donation.supporterDisplayName || 'Unknown supporter'}</div>
                                            <div className="donors-supporter-org">{donation.supporterEmail || 'No email'}</div>
                                        </td>
                                        <td className="donors-date">{donation.donationDate ?? 'Unknown date'}</td>
                                        <td><span className="donors-value">{formatMoney(donation.amount ?? 0, donation.currencyCode ?? 'USD')}</span></td>
                                        <td>
                                            <span className={`donors-badge type-${donation.isRecurring ? 'partner' : 'monetary'}`}>{donation.donationType || 'Donation'}</span>
                                            {donation.isRecurring ? <span className="donors-badge status-active" style={{ marginLeft: '8px' }}>Recurring</span> : null}
                                        </td>
                                        <td>{donation.campaignName || '-'}</td>
                                        <td>{donation.channelSource || '-'}</td>
                                        <td style={{ maxWidth: '260px' }}><div className="donors-supporter-org text-truncate" title={donation.notes ?? ''}>{donation.notes || 'No notes'}</div></td>
                                        <td>
                                            <button type="button" className="donors-actions-menu-item" style={{ display: 'inline-flex', marginRight: '8px' }} onClick={() => openEditModal(donation)}>
                                                <PencilLine size={15} className="donors-menu-icon" />
                                                Edit
                                            </button>
                                            <button type="button" className="donors-actions-menu-item" style={{ display: 'inline-flex' }} onClick={() => { setDeleteTarget(donation); setShowDeleteConfirm(true); }}>
                                                <Trash2 size={15} className="donors-menu-icon" />
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={8} className="text-center py-5 text-muted">No donations found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="donors-table-footer">
                    <span>
                        Showing {totalCount === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + pageSize, totalCount)} of {totalCount}
                    </span>
                    <nav aria-label="Donation pagination">
                        <ul className="pagination mb-0 flex-wrap">
                            <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
                                <button className="page-link" type="button" onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={16} /></button>
                            </li>
                            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                                <li key={pageNumber} className={`page-item ${pageNumber === currentPage ? 'active' : ''}`}>
                                    <button className="page-link" type="button" onClick={() => setPage(pageNumber)}>{pageNumber}</button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))}><ChevronRight size={16} /></button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>

            {showEditor ? (
                <ModalShell
                    title={editingDonation ? `Edit Donation #${editingDonation.donationId}` : 'Create Donation'}
                    onClose={closeEditor}
                    alertMessage={errorMessage}
                    onCloseAlert={() => setErrorMessage('')}
                >
                    <div className="donors-detail-grid">
                        <div>
                            <h4 className="donors-allocation-title">Supporter</h4>
                            <div className="donors-history-list">
                                <label className="donors-filter-label" htmlFor="admin-donation-supporter-search">Existing supporter</label>
                                <input id="admin-donation-supporter-search" className="donors-filter-input" value={supporterLookupTerm} onChange={(event) => setSupporterLookupTerm(event.target.value)} placeholder="Search supporter name or email" />
                                <select className="donors-filter-select" value={form.supporterId} onChange={(event) => setForm((current) => ({ ...current, supporterId: event.target.value }))}>
                                    <option value="">Create or select a supporter</option>
                                    {supporterOptions.map((supporter) => <option key={supporter.supporterId} value={supporter.supporterId}>{supporter.displayName || supporter.email || `Supporter #${supporter.supporterId}`}{supporter.email ? ` (${supporter.email})` : ''}</option>)}
                                </select>
                                <div className="donors-state-text" style={{ margin: 0 }}>If you leave this blank, the form will create a supporter from the email below.</div>
                            </div>
                        </div>
                        <div>
                            <h4 className="donors-allocation-title">Donation Details</h4>
                            <div className="donors-history-list">
                                {!hasExplicitSupporter ? (
                                    <>
                                        <label className="donors-filter-label">Supporter email</label>
                                        <input className="donors-filter-input" value={form.supporterEmail} onChange={(event) => setForm((current) => ({ ...current, supporterEmail: event.target.value }))} placeholder="supporter@example.com" />
                                        <label className="donors-filter-label">First name</label>
                                        <input className="donors-filter-input" value={form.supporterFirstName} onChange={(event) => setForm((current) => ({ ...current, supporterFirstName: event.target.value }))} />
                                        <label className="donors-filter-label">Last name</label>
                                        <input className="donors-filter-input" value={form.supporterLastName} onChange={(event) => setForm((current) => ({ ...current, supporterLastName: event.target.value }))} />
                                        <label className="donors-filter-label">Display name</label>
                                        <input className="donors-filter-input" value={form.supporterDisplayName} onChange={(event) => setForm((current) => ({ ...current, supporterDisplayName: event.target.value }))} />
                                        <label className="donors-filter-label">Organization</label>
                                        <input className="donors-filter-input" value={form.supporterOrganizationName} onChange={(event) => setForm((current) => ({ ...current, supporterOrganizationName: event.target.value }))} />
                                        <label className="donors-filter-label">Supporter type</label>
                                        <select className="donors-filter-select" value={form.supporterType} onChange={(event) => setForm((current) => ({ ...current, supporterType: event.target.value }))}>{supporterTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                                        <label className="donors-filter-label">Status</label>
                                        <select className="donors-filter-select" value={form.supporterStatus} onChange={(event) => setForm((current) => ({ ...current, supporterStatus: event.target.value }))}>{supporterStatusOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                                    </>
                                ) : null}
                                {selectedSupporter ? <div className="donors-state-text" style={{ margin: 0 }}>Selected supporter: {selectedSupporter.displayName || selectedSupporter.email || `Supporter #${selectedSupporter.supporterId}`}</div> : null}
                                <label className="donors-filter-label">Donation type</label>
                                <select className="donors-filter-select" value={form.donationType} onChange={(event) => setForm((current) => ({ ...current, donationType: event.target.value }))}><option value="">Select a type</option>{donationTypeOptions.map((option) => <option key={option} value={option}>{option}</option>)}</select>
                                <label className="donors-filter-label">Donation date</label>
                                <input type="date" className="donors-filter-input" value={form.donationDate} onChange={(event) => setForm((current) => ({ ...current, donationDate: event.target.value }))} />
                                <label className="donors-filter-label">Recurring donation</label>
                                <input type="checkbox" checked={form.isRecurring} onChange={(event) => setForm((current) => ({ ...current, isRecurring: event.target.checked }))} />
                                <label className="donors-filter-label">Amount</label>
                                <input type="number" step="0.01" className="donors-filter-input" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} />
                                <label className="donors-filter-label">Estimated value</label>
                                <input type="number" step="0.01" className="donors-filter-input" value={form.estimatedValue} onChange={(event) => setForm((current) => ({ ...current, estimatedValue: event.target.value }))} />
                                <label className="donors-filter-label">Currency</label>
                                <input className="donors-filter-input" value={form.currencyCode === 'USD' && !editingDonation ? '' : form.currencyCode} onChange={(event) => setForm((current) => ({ ...current, currencyCode: event.target.value.toUpperCase() }))} list="currency-options" placeholder="USD" />
                                <label className="donors-filter-label">Campaign</label>
                                <input className="donors-filter-input" value={form.campaignName} onChange={(event) => setForm((current) => ({ ...current, campaignName: event.target.value }))} />
                                <label className="donors-filter-label">Channel source</label>
                                <input className="donors-filter-input" value={form.channelSource} onChange={(event) => setForm((current) => ({ ...current, channelSource: event.target.value }))} />
                                <label className="donors-filter-label">Impact unit</label>
                                <input className="donors-filter-input" value={form.impactUnit} onChange={(event) => setForm((current) => ({ ...current, impactUnit: event.target.value }))} />
                                <label className="donors-filter-label">Referral post id</label>
                                <input type="number" className="donors-filter-input" value={form.referralPostId} onChange={(event) => setForm((current) => ({ ...current, referralPostId: event.target.value }))} />
                                <label className="donors-filter-label">Notes</label>
                                <textarea className="donors-filter-input" rows={4} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
                            </div>
                        </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <button type="button" className="donors-actions-menu-item" onClick={closeEditor} disabled={isSaving}>Cancel</button>
                        <PrimaryButton onClick={handleSaveDonation} loading={isSaving}>{editingDonation ? 'Save Changes' : 'Create Donation'}</PrimaryButton>
                    </div>
                </ModalShell>
            ) : null}

            {showDeleteConfirm && deleteTarget ? (
                <ModalShell
                    title={`Delete Donation #${deleteTarget.donationId}`}
                    onClose={closeDeleteConfirm}
                    alertMessage={errorMessage}
                    onCloseAlert={() => setErrorMessage('')}
                >
                    <p className="mb-3">This will permanently remove the donation for <strong>{deleteTarget.supporterDisplayName || deleteTarget.supporterEmail || 'this supporter'}</strong>.</p>
                    <div className="d-flex justify-content-end gap-2">
                        <button type="button" className="donors-actions-menu-item" onClick={closeDeleteConfirm} disabled={isSaving}>Cancel</button>
                        <button type="button" className="donors-actions-menu-item" onClick={handleDeleteDonation} disabled={isSaving}>Delete Donation</button>
                    </div>
                </ModalShell>
            ) : null}
        </div>
    );
}

function ModalShell({
    title,
    onClose,
    children,
    alertMessage,
    onCloseAlert,
}: {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
    alertMessage?: string;
    onCloseAlert?: () => void;
}) {
    return (
        <div className="position-fixed top-0 start-0 w-100 h-100" style={{ backgroundColor: 'rgba(15, 23, 42, 0.58)', zIndex: 1050, padding: '12px' }} role="presentation" onClick={onClose}>
            <div className="bg-white rounded-4 shadow-lg mx-auto p-4" style={{ maxWidth: 'min(980px, calc(100vw - 24px))', maxHeight: 'calc(100vh - 24px)', marginTop: '0', overflowY: 'auto' }} role="dialog" aria-modal="true" aria-labelledby="adminDonationModalTitle" onClick={(event) => event.stopPropagation()}>
                <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                    <h4 id="adminDonationModalTitle" className="mb-0">{title}</h4>
                    <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>Close</button>
                </div>
                {alertMessage ? (
                    <AlertBanner type="warning" message={alertMessage} onClose={onCloseAlert} />
                ) : null}
                {children}
                <datalist id="currency-options">
                    {currencyOptions.map((option) => <option key={option} value={option} />)}
                </datalist>
            </div>
        </div>
    );
}