import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, DollarSign, Filter, Gift, RefreshCw, Search, Users } from 'lucide-react';
import AlertBanner from '../components/ui/AlertBanner';
import PrimaryButton from '../components/ui/PrimaryButton';
import { formatMoney } from '../lib/formatters';
import { getMyDonations } from '../lib/authAPI';
import type { DonationRecord, RepeatDonationState } from '../types/DonationTypes';
import '../styles/pages/donors.css';

export default function DonationsPage() {
    const navigate = useNavigate();
    const [donations, setDonations] = useState<DonationRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const loadDonations = useCallback(async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const response = await getMyDonations({
                page,
                pageSize,
                search: searchTerm,
            });

            setDonations(response.items);
            setTotalCount(response.totalCount);
            setTotalPages(response.totalPages);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : 'Unable to load donation history.'
            );
        } finally {
            setIsLoading(false);
        }
    }, [page, pageSize, searchTerm]);

    useEffect(() => {
        void loadDonations();
    }, [loadDonations]);

    useEffect(() => {
        setPage(1);
    }, [searchTerm, pageSize]);

    const currentPage = totalPages === 0 ? 0 : Math.min(page, totalPages);
    const visibleDonations = donations;
    const startIndex = currentPage === 0 ? 0 : (currentPage - 1) * pageSize;

    const summary = useMemo(() => {
        const monetaryTotal = donations.reduce((sum, donation) => sum + (donation.amount ?? 0), 0);
        const recurringCount = donations.filter((donation) => donation.isRecurring).length;
        const latestDonation = donations
            .map((donation) => donation.donationDate)
            .filter((value): value is string => Boolean(value))
            .sort((a, b) => b.localeCompare(a))[0] ?? null;

        return {
            monetaryTotal,
            recurringCount,
            latestDonation,
        };
    }, [donations]);

    const handleRepeatDonation = (donation: DonationRecord) => {
        const repeatState: RepeatDonationState = {
            donationType: donation.isRecurring ? 'monthly' : 'one-time',
            amount: donation.amount,
            notes: donation.notes,
            campaignName: donation.campaignName,
            channelSource: donation.channelSource,
        };

        navigate('/donate', { state: repeatState });
    };

    return (
        <div className="container py-5" style={{ maxWidth: '1240px' }}>
            <div className="donors-header">
                <div className="admin-page-header">
                    <h1 className="admin-page-title">My Donations</h1>
                    <p className="admin-page-subtitle">Review your giving history, search donations, and repeat a previous gift.</p>
                    <div style={{ marginTop: '10px' }}>
                        <Link to="/dashboard" className="dash-panel-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <ChevronLeft size={14} />
                            Back to Dashboard
                        </Link>
                    </div>
                </div>
                <div className="donors-header-actions">
                    <PrimaryButton onClick={() => navigate('/donate')}>
                        <Gift size={16} />
                        Make Donation
                    </PrimaryButton>
                </div>
            </div>

            {errorMessage ? (
                <AlertBanner message={errorMessage} type="warning" onClose={() => setErrorMessage('')} />
            ) : null}

            <div className="donors-summary">
                <div className="donors-chip">
                    <div className="donors-chip-icon supporters"><Users size={20} /></div>
                    <div>
                        <div className="donors-chip-value">{totalCount.toLocaleString()}</div>
                        <div className="donors-chip-label">Total Donations</div>
                    </div>
                </div>
                <div className="donors-chip">
                    <div className="donors-chip-icon monthly"><DollarSign size={20} /></div>
                    <div>
                        <div className="donors-chip-value">{formatMoney(summary.monetaryTotal)}</div>
                        <div className="donors-chip-label">Visible Total</div>
                    </div>
                </div>
                <div className="donors-chip">
                    <div className="donors-chip-icon recurring"><RefreshCw size={20} /></div>
                    <div>
                        <div className="donors-chip-value">{summary.recurringCount}</div>
                        <div className="donors-chip-label">Recurring (Visible)</div>
                    </div>
                </div>
                <div className="donors-chip">
                    <div className="donors-chip-icon inkind"><ArrowLeft size={20} style={{ transform: 'rotate(180deg)' }} /></div>
                    <div>
                        <div className="donors-chip-value" style={{ fontSize: '1.05rem' }}>{summary.latestDonation ?? '-'}</div>
                        <div className="donors-chip-label">Latest Donation (Visible)</div>
                    </div>
                </div>
            </div>

            <div className="donors-filters">
                <div className="donors-filters-row" style={{ gridTemplateColumns: '2fr 1fr' }}>
                    <div className="donors-filter-group">
                        <label className="donors-filter-label" htmlFor="donor-donation-search">Search</label>
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)', pointerEvents: 'none' }} />
                            <input
                                id="donor-donation-search"
                                className="donors-filter-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Type, campaign, channel, notes..."
                                style={{ paddingLeft: '36px' }}
                            />
                        </div>
                    </div>
                    <div className="donors-filter-group">
                        <label className="donors-filter-label" htmlFor="donor-donation-page-size">
                            <Filter size={14} style={{ verticalAlign: 'text-bottom', marginRight: '6px' }} />
                            Display
                        </label>
                        <select
                            id="donor-donation-page-size"
                            className="donors-filter-select"
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                        >
                            {[5, 10, 15, 25, 50].map((size) => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="donors-table-wrap">
                <div className="donors-table-scroll">
                    <table className="donors-table">
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Amount</th>
                                <th>Type</th>
                                <th>Campaign</th>
                                <th>Channel</th>
                                <th>Notes</th>
                                <th style={{ width: '220px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-5 text-muted">Loading your donations...</td>
                                </tr>
                            ) : visibleDonations.length > 0 ? (
                                visibleDonations.map((donation) => (
                                    <tr key={donation.donationId}>
                                        <td className="donors-date">{donation.donationDate ?? 'Unknown date'}</td>
                                        <td><span className="donors-value">{formatMoney(donation.amount ?? 0, donation.currencyCode ?? 'USD')}</span></td>
                                        <td>
                                            <span className={`donors-badge type-${donation.isRecurring ? 'partner' : 'monetary'}`}>
                                                {donation.donationType ?? 'Donation'}
                                            </span>
                                            {donation.isRecurring ? (
                                                <span className="donors-badge status-active" style={{ marginLeft: '8px' }}>
                                                    Recurring
                                                </span>
                                            ) : null}
                                        </td>
                                        <td>{donation.campaignName || '-'}</td>
                                        <td>{donation.channelSource || '-'}</td>
                                        <td style={{ maxWidth: '300px' }}>
                                            <div className="donors-supporter-org text-truncate" title={donation.notes ?? ''}>
                                                {donation.notes || 'No notes provided'}
                                            </div>
                                        </td>
                                        <td>
                                            <button
                                                type="button"
                                                className="donors-actions-menu-item"
                                                style={{ display: 'inline-flex' }}
                                                onClick={() => handleRepeatDonation(donation)}
                                            >
                                                <RefreshCw size={15} className="donors-menu-icon" />
                                                Repeat this donation
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="text-center py-5 text-muted">No donations found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="donors-table-footer">
                    <div>
                        Showing {totalCount === 0 ? 0 : startIndex + 1} to{' '}
                        {Math.min(startIndex + pageSize, totalCount)} of {totalCount}
                    </div>

                    <nav aria-label="Donation pagination">
                        <ul className="pagination mb-0 flex-wrap">
                            <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
                                <button className="page-link" type="button" onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
                                    <ChevronLeft size={16} />
                                </button>
                            </li>
                            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                                <li key={pageNumber} className={`page-item ${pageNumber === currentPage ? 'active' : ''}`}>
                                    <button className="page-link" type="button" onClick={() => setPage(pageNumber)}>
                                        {pageNumber}
                                    </button>
                                </li>
                            ))}
                            <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
                                <button className="page-link" type="button" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
                                    <ChevronRight size={16} />
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    );
}
