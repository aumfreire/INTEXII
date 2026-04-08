import type { AuthSession } from '../types/AuthSession';
import type { TwoFactorStatus } from '../types/TwoFactorStatus';
import type {
    AdminCreateUserRequest,
    AdminCreateUserResponse,
    AdminDonationSummary,
    AdminUserDetail,
    AdminUserSummary,
    AdminUserSummaryMetrics,
    AdminUpdateProfileRequest,
} from '../types/AdminUser';
import type { DonationRecord, PagedDonationResponse } from '../types/DonationTypes';
import type { DonationSupporterOption, DonationUpsertRequest } from '../types/AdminDonation';
import type { DonorDonationCreateRequest } from '../types/DonationTypes';

export interface ExternalAuthProvider {
    name: string;
    displayName: string;
}

export interface ManagedProfile {
    firstName: string | null;
    lastName: string | null;
    displayName: string;
}

interface TokenLoginResponse {
    accessToken: string;
    tokenType: string;
    expiresInSeconds: number;
}

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const isLocalBrowser =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const apiBaseUrl =
    configuredApiBaseUrl && configuredApiBaseUrl.length > 0
        ? configuredApiBaseUrl.replace(/\/$/, '')
        : isLocalBrowser
            ? ''
            : 'https://intexii-backend.azurewebsites.net';
const authTokenStorageKey = 'intex-auth-token-v1';

function getStoredAuthToken(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    return window.localStorage.getItem(authTokenStorageKey);
}

export function setStoredAuthToken(token: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    const normalized = token.trim();
    if (!normalized) {
        window.localStorage.removeItem(authTokenStorageKey);
        return;
    }

    window.localStorage.setItem(authTokenStorageKey, normalized);
}

export function clearStoredAuthToken(): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.localStorage.removeItem(authTokenStorageKey);
}

function createAuthHeaders(headers?: HeadersInit): Headers {
    const combined = new Headers(headers);
    const authToken = getStoredAuthToken();

    if (authToken) {
        combined.set('Authorization', `Bearer ${authToken}`);
    }

    return combined;
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
    return fetch(`${apiBaseUrl}${path}`, {
        credentials: 'include',
        ...init,
        headers: createAuthHeaders(init?.headers),
    });
}

async function readApiError(
    response: Response,
    fallbackMessage: string
): Promise<string> {
    const contentType = response.headers.get('content-type') ?? '';

    if (!contentType.includes('application/json')) {
        return fallbackMessage;
    }

    const data = await response.json();

    if (typeof data?.detail === 'string' && data.detail.length > 0) {
        return data.detail;
    }

    if (typeof data?.title === 'string' && data.title.length > 0) {
        return data.title;
    }

    if (data?.errors && typeof data.errors === 'object') {
        const firstError = Object.values(data.errors)
            .flat()
            .find((value): value is string => typeof value === 'string');

        if (firstError) {
            return firstError;
        }
    }

    if (typeof data?.message === 'string' && data.message.length > 0) {
        return data.message;
    }

    return fallbackMessage;
}

async function postTwoFactorRequest(payload: object): Promise<TwoFactorStatus> {
    const response = await apiFetch('/api/auth/manage/2fa', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to update MFA settings.')
        );
    }

    return response.json();
}

export function buildExternalLoginUrl(
    provider: string,
    returnPath = '/dashboard'
): string {
    const searchParams = new URLSearchParams({
        provider,
        returnPath,
    });

    return `${apiBaseUrl}/api/auth/external-login?${searchParams.toString()}`;
}

export async function getExternalProviders(): Promise<ExternalAuthProvider[]> {
    const response = await apiFetch('/api/auth/providers');

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to load external login providers.')
        );
    }

    return response.json();
}

export async function getAuthSession(): Promise<AuthSession> {
    const response = await apiFetch('/api/auth/me');

    if (!response.ok) {
        throw new Error('Unable to load auth session.');
    }

    return response.json();
}

export async function registerUser(email: string, password: string): Promise<void> {
    const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to register the account.')
        );
    }
}

export async function loginUser(
    email: string,
    password: string,
    _rememberMe: boolean,
    twoFactorCode?: string,
    twoFactorRecoveryCode?: string
): Promise<void> {
    const body: Record<string, string> = {
        email,
        password,
    };

    if (twoFactorCode) {
        body.twoFactorCode = twoFactorCode;
    }

    if (twoFactorRecoveryCode) {
        body.twoFactorRecoveryCode = twoFactorRecoveryCode;
    }

    const response = await apiFetch('/api/auth/token-login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(
                response,
                'Unable to log in. If MFA is enabled, include an authenticator code or recovery code.'
            )
        );
    }

    const payload = (await response.json()) as TokenLoginResponse;
    if (!payload.accessToken) {
        throw new Error('Login succeeded but no access token was returned.');
    }

    setStoredAuthToken(payload.accessToken);
}

export async function logoutUser(): Promise<void> {
    const response = await apiFetch('/api/auth/logout', {
        method: 'POST',
    });

    clearStoredAuthToken();

    if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to log out.'));
    }
}

export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
    return postTwoFactorRequest({});
}

export async function enableTwoFactor(
    twoFactorCode: string
): Promise<TwoFactorStatus> {
    return postTwoFactorRequest({
        enable: true,
        twoFactorCode,
        resetRecoveryCodes: true,
    });
}

export async function disableTwoFactor(): Promise<TwoFactorStatus> {
    return postTwoFactorRequest({
        enable: false,
    });
}

export async function resetRecoveryCodes(): Promise<TwoFactorStatus> {
    return postTwoFactorRequest({
        resetRecoveryCodes: true,
    });
}

export async function updatePassword(
    oldPassword: string,
    newPassword: string
): Promise<void> {
    const response = await apiFetch('/api/auth/manage/info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            oldPassword,
            newPassword,
        }),
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to update the password.')
        );
    }
}

export async function getManagedProfile(): Promise<ManagedProfile> {
    const response = await apiFetch('/api/auth/manage/profile');

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to load profile details.')
        );
    }

    return response.json();
}

export async function updateManagedProfile(
    payload: Partial<Pick<ManagedProfile, 'firstName' | 'lastName' | 'displayName'>>
): Promise<ManagedProfile> {
    const response = await apiFetch('/api/auth/manage/profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to update profile details.')
        );
    }

    return response.json();
}

export async function getAdminSummary(): Promise<AdminUserSummaryMetrics> {
    const response = await apiFetch('/api/admin/users/summary');

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to load admin dashboard metrics.')
        );
    }

    return response.json();
}

export async function getAdminDonationSummary(): Promise<AdminDonationSummary> {
    const response = await apiFetch('/api/donations/admin/summary');

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to load donation metrics.')
        );
    }

    return response.json();
}

function buildDonationQueryParams(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    supporterId?: string | number;
}): string {
    const query = new URLSearchParams();

    if (options.page && options.page > 0) {
        query.set('page', String(options.page));
    }

    if (options.pageSize && options.pageSize > 0) {
        query.set('pageSize', String(options.pageSize));
    }

    if (options.search && options.search.trim().length > 0) {
        query.set('search', options.search.trim());
    }

    if (options.supporterId !== undefined && options.supporterId !== null && `${options.supporterId}`.trim().length > 0) {
        query.set('supporterId', `${options.supporterId}`.trim());
    }

    const serialized = query.toString();
    return serialized.length > 0 ? `?${serialized}` : '';
}

export async function getMyDonations(options: {
    page?: number;
    pageSize?: number;
    search?: string;
} = {}): Promise<PagedDonationResponse<DonationRecord>> {
    const response = await apiFetch(`/api/donations/my${buildDonationQueryParams(options)}`);

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to load your donation history.')
        );
    }

    return response.json();
}

export async function getAdminDonations(options: {
    page?: number;
    pageSize?: number;
    search?: string;
    supporterId?: string | number;
} = {}): Promise<PagedDonationResponse<DonationRecord>> {
    const response = await apiFetch(`/api/donations${buildDonationQueryParams(options)}`);

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to load donations.')
        );
    }

    return response.json();
}

export async function getDonationSupporters(search = ''): Promise<DonationSupporterOption[]> {
    const query = new URLSearchParams();

    if (search.trim().length > 0) {
        query.set('search', search.trim());
    }

    const response = await apiFetch(
        `/api/donations/supporters${query.toString() ? `?${query.toString()}` : ''}`
    );

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to load supporter options.')
        );
    }

    return response.json();
}

export async function createDonation(payload: DonationUpsertRequest): Promise<DonationRecord> {
    const response = await apiFetch('/api/donations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to create donation.')
        );
    }

    return response.json();
}

export async function createMyDonation(payload: DonorDonationCreateRequest): Promise<DonationRecord> {
    const response = await apiFetch('/api/donations/my', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to create your donation.')
        );
    }

    return response.json();
}

export async function updateDonation(
    donationId: number,
    payload: DonationUpsertRequest
): Promise<DonationRecord> {
    const response = await apiFetch(`/api/donations/${donationId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to update donation.')
        );
    }

    return response.json();
}

export async function deleteDonation(donationId: number): Promise<void> {
    const response = await apiFetch(`/api/donations/${donationId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to delete donation.')
        );
    }
}

export async function listAdminUsers(search = ''): Promise<AdminUserSummary[]> {
    const query = new URLSearchParams();
    if (search.trim().length > 0) {
        query.set('search', search.trim());
    }

    const response = await apiFetch(`/api/admin/users${query.toString() ? `?${query.toString()}` : ''}`);

    if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to load users.'));
    }

    return response.json();
}

export async function getAdminUserById(userId: string): Promise<AdminUserDetail> {
    const response = await apiFetch(`/api/admin/users/${userId}`);

    if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to load user details.'));
    }

    return response.json();
}

export async function adminCreateUser(
    payload: AdminCreateUserRequest
): Promise<AdminCreateUserResponse> {
    const response = await apiFetch('/api/admin/users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to create user.'));
    }

    return response.json();
}

export async function adminUpdateUserProfile(
    userId: string,
    payload: AdminUpdateProfileRequest
): Promise<void> {
    const response = await apiFetch(`/api/admin/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to update profile details.'));
    }
}

export async function adminResetUserPassword(
    userId: string,
    newPassword: string
): Promise<void> {
    const response = await apiFetch(`/api/admin/users/${userId}/password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to reset password.'));
    }
}

export async function adminResetUserMfa(userId: string): Promise<void> {
    const response = await apiFetch(`/api/admin/users/${userId}/mfa/reset`, {
        method: 'POST',
    });

    if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to reset MFA.'));
    }
}

export async function adminUpdateUserRoles(userId: string, roles: string[]): Promise<string[]> {
    const response = await apiFetch(`/api/admin/users/${userId}/roles`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roles }),
    });

    if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to update roles.'));
    }

    const payload = await response.json();
    return Array.isArray(payload.roles) ? payload.roles : [];
}

export async function deleteAdminUser(userId: string): Promise<void> {
    const response = await apiFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to delete user.'));
    }
}
