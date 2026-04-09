import type {
    InsightResponse,
    DonorLapseRecord,
    SafehouseHealthRecord,
    ResidentRiskRecord,
    SocialEngagementRecord,
} from '../types/InsightTypes';

const API_BASE =
    import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ??
    (import.meta.env.DEV ? 'http://localhost:5062' : '');

async function fetchInsight<T>(path: string): Promise<InsightResponse<T>> {
    const res = await fetch(`${API_BASE}${path}`, { credentials: 'include' });
    if (!res.ok) {
        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || `Request failed: ${res.status}`);
    }
    return res.json() as Promise<InsightResponse<T>>;
}

export const getDonorLapse = () =>
    fetchInsight<DonorLapseRecord>('/api/insights/donor-lapse');

export const getSafehouseHealth = () =>
    fetchInsight<SafehouseHealthRecord>('/api/insights/safehouse-health');

export const getResidentRisk = () =>
    fetchInsight<ResidentRiskRecord>('/api/insights/resident-risk');

export const getSocialEngagement = () =>
    fetchInsight<SocialEngagementRecord>('/api/insights/social-engagement');
