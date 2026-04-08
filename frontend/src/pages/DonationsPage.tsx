import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronLeft, ChevronRight, Filter, Search, RefreshCw } from 'lucide-react';
import AlertBanner from '../components/ui/AlertBanner';
import { formatCurrency } from '../lib/formatters';
import { getMyDonations } from '../lib/authAPI';
import type { DonationRecord, RepeatDonationState } from '../types/DonationTypes';

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
        <div className="container py-5">
            <div className="login-card" style={{ maxWidth: '1200px' }}>
                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-end gap-3 mb-4">
                    <div>
                        <h2 className="mb-2">My Donations</h2>
                        <p className="login-subtitle mb-0">
                            Review your giving history, search donations, and repeat a previous gift.
                        </p>
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                        <Link to="/dashboard" className="btn btn-outline-secondary">
                            <ArrowLeft size={16} className="me-1" />
                            Back to Dashboard
                        </Link>
                        <Link to="/donate" className="btn btn-primary">
                            Make Donation
                        </Link>
                    </div>
                </div>

                {errorMessage ? (
                    <AlertBanner message={errorMessage} type="warning" onClose={() => setErrorMessage('')} />
                ) : null}

                <div className="d-flex flex-column flex-md-row gap-3 align-items-md-center justify-content-between mb-3">
                    <div className="position-relative flex-grow-1" style={{ maxWidth: '520px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-muted)' }} />
                        <input
                            className="form-control"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by notes, campaign, channel, or type"
                            style={{ paddingLeft: '42px' }}
                        />
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <Filter size={16} className="text-muted" />
                        <label className="small text-muted mb-0" htmlFor="pageSize">
                            Display
                        </label>
                        <select
                            id="pageSize"
                            className="form-select"
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            style={{ width: '110px' }}
                        >
                            {[5, 10, 15, 25, 50].map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="border rounded-3 bg-white shadow-sm overflow-hidden">
                    <div className="table-responsive">
                        <table className="table align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th>Date</th>
                                    <th>Amount</th>
                                    <th>Type</th>
                                    <th>Notes</th>
                                    <th style={{ width: '220px' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5 text-muted">
                                            Loading your donations...
                                        </td>
                                    </tr>
                                ) : visibleDonations.length > 0 ? (
                                    visibleDonations.map((donation) => (
                                        <tr key={donation.donationId}>
                                            <td>{donation.donationDate ?? 'Unknown date'}</td>
                                            <td>
                                                <strong>{formatCurrency(donation.amount ?? 0)}</strong>
                                            </td>
                                            <td>
                                                {donation.donationType ?? 'Donation'}
                                                {donation.isRecurring ? (
                                                    <span className="badge text-bg-light ms-2">Recurring</span>
                                                ) : null}
                                            </td>
                                            <td style={{ maxWidth: '320px' }}>
                                                <div className="text-truncate" title={donation.notes ?? ''}>
                                                    {donation.notes || 'No notes provided'}
                                                </div>
                                            </td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-outline-primary me-2"
                                                    onClick={() => handleRepeatDonation(donation)}
                                                >
                                                    <RefreshCw size={14} className="me-1" />
                                                    Repeat this donation
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-5 text-muted">
                                            No donations found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 mt-3">
                    <div className="text-muted small">
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
