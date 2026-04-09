import type {
    InsightResponse,
    DonorLapseRecord,
    SafehouseHealthRecord,
    ResidentRiskRecord,
    SocialEngagementRecord,
} from '../types/InsightTypes';

const API_BASE =
    import.meta.env.VITE_API_BASE_URL?.trim()
        ? import.meta.env.VITE_API_BASE_URL.trim().replace(/\/$/, '')
        : (typeof window !== 'undefined' &&
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
            ? ''
            : 'https://intexii-backend.azurewebsites.net';

const AUTH_TOKEN_STORAGE_KEY = 'intex-auth-token-v1';

function createAuthHeaders(headers?: HeadersInit): Headers {
    const combined = new Headers(headers);

    if (typeof window === 'undefined') {
        return combined;
    }

    const authToken = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)?.trim();
    if (authToken) {
        combined.set('Authorization', `Bearer ${authToken}`);
    }

    return combined;
}

async function fetchInsight<T>(path: string): Promise<InsightResponse<T>> {
    const res = await fetch(`${API_BASE}${path}`, {
        credentials: 'include',
        headers: createAuthHeaders(),
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            throw new Error('You are not authorized to view Action Insights. Please sign out and sign back in with an Admin account.');
        }

        const text = await res.text().catch(() => res.statusText);
        throw new Error(text || `Request failed: ${res.status}`);
    }

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.toLowerCase().includes('application/json')) {
        const responseText = await res.text().catch(() => '');
        const snippet = responseText.slice(0, 120).trim();
        throw new Error(
            `Insights API returned non-JSON content from ${res.url} (status ${res.status}). ` +
            `This usually means the request was routed to the frontend host instead of the backend API.` +
            (snippet ? ` Response starts with: ${snippet}` : '')
        );
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
