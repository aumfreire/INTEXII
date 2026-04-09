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

export interface AdminCaseloadResident {
    id: number;
    name: string;
    code: string;
    safehouse: string;
    caseStatus: string;
    caseCategory: string;
    riskLevel: string;
    assignedWorker: string | null;
    reintegrationStatus: string;
    lastUpdate: string;
}

export interface AdminProcessRecording {
    id: number;
    date: string | null;
    worker: string | null;
    sessionType: string | null;
    emotionStart: string | null;
    emotionEnd: string | null;
    progressNoted: boolean;
    concernFlagged: boolean;
    referralMade: boolean;
    summary: string;
}

export interface AdminHomeVisit {
    id: number;
    date: string | null;
    type: string | null;
    worker: string | null;
    cooperation: string | null;
    safetyConcern: boolean;
    followUpNeeded: boolean;
    notes: string;
}

export interface AdminCaseConference {
    id: number;
    date: string | null;
    upcoming: boolean;
    attendees: string | null;
    notes: string | null;
}

export interface AdminReintegrationIntervention {
    id: number;
    category: string | null;
    description: string | null;
    services: string | null;
    targetDate: string | null;
    status: string | null;
}

export interface AdminResidentDetail {
    id: number;
    name: string;
    initials: string;
    code: string;
    caseControlNumber: string | null;
    safehouse: string;
    caseStatus: string;
    riskLevel: string;
    assignedWorker: string | null;
    caseCategory: string;
    caseSubCategory: string | null;
    admissionDate: string | null;
    dateOfBirth: string | null;
    age: number | null;
    gender: string | null;
    nationality: string | null;
    education: string | null;
    referralSource: string | null;
    referralOfficer: string | null;
    referralDate: string | null;
    familyStatus: string | null;
    siblings: string | null;
    familyContact: string | null;
    reintegrationType: string | null;
    reintegrationStatus: string;
    notesRestricted: string | null;
    recordings: AdminProcessRecording[];
    visits: AdminHomeVisit[];
    conferences: AdminCaseConference[];
    reintegrationInterventions: AdminReintegrationIntervention[];
}

export interface AdminSupporterSummary {
    id: number;
    name: string;
    organization: string | null;
    email: string | null;
    phone: string | null;
    region: string | null;
    country: string | null;
    relationshipType: string | null;
    type: string;
    status: string;
    channel: string;
    firstDonation: string | null;
    lastContribution: string | null;
    lifetimeValue: number;
}

export interface AdminSupporterContribution {
    donationId: number;
    date: string | null;
    description: string;
    amount: number;
}

export interface AdminSupporterAllocation {
    label: string;
    percent: number;
}

export interface AdminSupporterDetail {
    id: number;
    name: string;
    organization: string | null;
    email: string | null;
    phone: string | null;
    region: string | null;
    country: string | null;
    relationshipType: string | null;
    type: string;
    status: string;
    channel: string;
    firstDonation: string | null;
    contributions: AdminSupporterContribution[];
    allocations: AdminSupporterAllocation[];
}

export interface AdminSupporterUpsertRequest {
    displayName?: string | null;
    organization?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    relationshipType?: string | null;
    region?: string | null;
    country?: string | null;
    email?: string | null;
    phone?: string | null;
    type?: string | null;
    status?: string | null;
    channel?: string | null;
    firstDonation?: string | null;
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

export async function getAdminCaseload(): Promise<AdminCaseloadResident[]> {
    const response = await apiFetch('/api/residents/caseload');

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to load caseload data.')
        );
    }

    return response.json();
}

export async function getAdminResidentDetail(id: number | string): Promise<AdminResidentDetail> {
    const response = await apiFetch(`/api/residents/${id}/detail`);

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to load resident details.')
        );
    }

    return response.json();
}

export async function getAdminSupporters(options: {
    search?: string;
    type?: string;
    status?: string;
    channel?: string;
} = {}): Promise<AdminSupporterSummary[]> {
    const query = new URLSearchParams();

    if (options.search?.trim()) query.set('search', options.search.trim());
    if (options.type?.trim()) query.set('type', options.type.trim());
    if (options.status?.trim()) query.set('status', options.status.trim());
    if (options.channel?.trim()) query.set('channel', options.channel.trim());

    const response = await apiFetch(`/api/supporters${query.toString() ? `?${query.toString()}` : ''}`);

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to load supporter data.')
        );
    }

    return response.json();
}

export async function getAdminSupporterDetail(id: number | string): Promise<AdminSupporterDetail> {
    const response = await apiFetch(`/api/supporters/${id}`);

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to load supporter detail.')
        );
    }

    return response.json();
}

export async function createAdminSupporter(payload: AdminSupporterUpsertRequest): Promise<AdminSupporterDetail> {
    const response = await apiFetch('/api/supporters', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to create supporter.')
        );
    }

    return response.json();
}

export async function updateAdminSupporter(id: number | string, payload: AdminSupporterUpsertRequest): Promise<AdminSupporterDetail> {
    const response = await apiFetch(`/api/supporters/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to update supporter.')
        );
    }

    return response.json();
}

export async function deleteAdminSupporter(id: number | string): Promise<void> {
    const response = await apiFetch(`/api/supporters/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to delete supporter.')
        );
    }
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

// ── Residents CRUD ────────────────────────────────────────────────────────────

export interface ResidentOption {
    id: number;
    name: string;
}

export interface ResidentUpsertRequest {
    caseControlNo?: string | null;
    internalCode?: string | null;
    safehouseId?: number | null;
    assignedSocialWorker?: string | null;
    sex?: string | null;
    dateOfBirth?: string | null;
    placeOfBirth?: string | null;
    religion?: string | null;
    birthStatus?: string | null;
    caseStatus?: string | null;
    caseCategory?: string | null;
    initialRiskLevel?: string | null;
    currentRiskLevel?: string | null;
    referralSource?: string | null;
    referringAgencyPerson?: string | null;
    subCatOrphaned?: boolean | null;
    subCatTrafficked?: boolean | null;
    subCatChildLabor?: boolean | null;
    subCatPhysicalAbuse?: boolean | null;
    subCatSexualAbuse?: boolean | null;
    subCatOsaec?: boolean | null;
    subCatCicl?: boolean | null;
    subCatAtRisk?: boolean | null;
    subCatStreetChild?: boolean | null;
    subCatChildWithHiv?: boolean | null;
    isPwd?: boolean | null;
    pwdType?: string | null;
    hasSpecialNeeds?: boolean | null;
    specialNeedsDiagnosis?: string | null;
    familyIs4ps?: boolean | null;
    familySoloParent?: boolean | null;
    familyIndigenous?: boolean | null;
    familyParentPwd?: boolean | null;
    familyInformalSettler?: boolean | null;
    dateOfAdmission?: string | null;
    dateColbRegistered?: string | null;
    dateColbObtained?: string | null;
    dateEnrolled?: string | null;
    dateCaseStudyPrepared?: string | null;
    reintegrationType?: string | null;
    reintegrationStatus?: string | null;
}

export async function getAdminResidentOptions(): Promise<ResidentOption[]> {
    const response = await apiFetch('/api/residents/options');
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load resident options.'));
    return response.json();
}

export async function createAdminResident(payload: ResidentUpsertRequest): Promise<AdminCaseloadResident> {
    const response = await apiFetch('/api/residents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to create resident.'));
    return response.json();
}

export async function updateAdminResident(id: number, payload: ResidentUpsertRequest): Promise<void> {
    const response = await apiFetch(`/api/residents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to update resident.'));
}

export async function closeAdminResident(id: number): Promise<void> {
    const response = await apiFetch(`/api/residents/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to close resident case.'));
}

// ── Process Recordings ────────────────────────────────────────────────────────

export interface ProcessRecordingListItem {
    id: number;
    residentId: number | null;
    residentName: string;
    sessionDate: string | null;
    socialWorker: string | null;
    sessionType: string | null;
    progressNoted: boolean;
    concernsFlagged: boolean;
    referralMade: boolean;
}

export interface ProcessRecordingDetail extends ProcessRecordingListItem {
    sessionDurationMinutes: number | null;
    emotionalStateObserved: string | null;
    emotionalStateEnd: string | null;
    sessionNarrative: string | null;
    interventionsApplied: string | null;
    followUpActions: string | null;
}

export interface ProcessRecordingUpsertRequest {
    residentId?: number | null;
    sessionDate?: string | null;
    socialWorker?: string | null;
    sessionType?: string | null;
    sessionDurationMinutes?: number | null;
    emotionalStateObserved?: string | null;
    emotionalStateEnd?: string | null;
    sessionNarrative?: string | null;
    interventionsApplied?: string | null;
    followUpActions?: string | null;
    progressNoted?: boolean | null;
    concernsFlagged?: boolean | null;
    referralMade?: boolean | null;
}

export interface PagedResponse<T> {
    total: number;
    page: number;
    pageSize: number;
    items: T[];
}

export async function getAdminProcessRecordings(options: {
    residentId?: number;
    search?: string;
    sessionType?: string;
    page?: number;
    pageSize?: number;
} = {}): Promise<PagedResponse<ProcessRecordingListItem>> {
    const q = new URLSearchParams();
    if (options.residentId) q.set('residentId', String(options.residentId));
    if (options.search?.trim()) q.set('search', options.search.trim());
    if (options.sessionType?.trim()) q.set('sessionType', options.sessionType.trim());
    if (options.page) q.set('page', String(options.page));
    if (options.pageSize) q.set('pageSize', String(options.pageSize));
    const response = await apiFetch(`/api/process-recordings${q.toString() ? `?${q}` : ''}`);
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load process recordings.'));
    return response.json();
}

export async function createAdminProcessRecording(payload: ProcessRecordingUpsertRequest): Promise<ProcessRecordingDetail> {
    const response = await apiFetch('/api/process-recordings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to create process recording.'));
    return response.json();
}

export async function updateAdminProcessRecording(id: number, payload: ProcessRecordingUpsertRequest): Promise<void> {
    const response = await apiFetch(`/api/process-recordings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to update process recording.'));
}

export async function deleteAdminProcessRecording(id: number): Promise<void> {
    const response = await apiFetch(`/api/process-recordings/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to delete process recording.'));
}

// ── Home Visitations ──────────────────────────────────────────────────────────

export interface HomeVisitationListItem {
    id: number;
    residentId: number | null;
    residentName: string;
    visitDate: string | null;
    socialWorker: string | null;
    visitType: string | null;
    safetyConcernsNoted: boolean;
    followUpNeeded: boolean;
    visitOutcome: string | null;
}

export interface HomeVisitationDetail extends HomeVisitationListItem {
    locationVisited: string | null;
    purpose: string | null;
    observations: string | null;
    familyCooperationLevel: string | null;
    followUpNotes: string | null;
}

export interface HomeVisitationUpsertRequest {
    residentId?: number | null;
    visitDate?: string | null;
    socialWorker?: string | null;
    visitType?: string | null;
    locationVisited?: string | null;
    purpose?: string | null;
    observations?: string | null;
    familyCooperationLevel?: string | null;
    safetyConcernsNoted?: boolean | null;
    followUpNeeded?: boolean | null;
    followUpNotes?: string | null;
    visitOutcome?: string | null;
}

export async function getAdminHomeVisitations(options: {
    residentId?: number;
    visitType?: string;
    safetyConcern?: boolean;
    search?: string;
    page?: number;
    pageSize?: number;
} = {}): Promise<PagedResponse<HomeVisitationListItem>> {
    const q = new URLSearchParams();
    if (options.residentId) q.set('residentId', String(options.residentId));
    if (options.visitType?.trim()) q.set('visitType', options.visitType.trim());
    if (options.safetyConcern !== undefined) q.set('safetyConcern', String(options.safetyConcern));
    if (options.search?.trim()) q.set('search', options.search.trim());
    if (options.page) q.set('page', String(options.page));
    if (options.pageSize) q.set('pageSize', String(options.pageSize));
    const response = await apiFetch(`/api/home-visitations${q.toString() ? `?${q}` : ''}`);
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load home visitations.'));
    return response.json();
}

export async function createAdminHomeVisitation(payload: HomeVisitationUpsertRequest): Promise<HomeVisitationDetail> {
    const response = await apiFetch('/api/home-visitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to create home visitation.'));
    return response.json();
}

export async function updateAdminHomeVisitation(id: number, payload: HomeVisitationUpsertRequest): Promise<void> {
    const response = await apiFetch(`/api/home-visitations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to update home visitation.'));
}

export async function deleteAdminHomeVisitation(id: number): Promise<void> {
    const response = await apiFetch(`/api/home-visitations/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to delete home visitation.'));
}

// ── Intervention Plans ────────────────────────────────────────────────────────

export interface InterventionPlanItem {
    id: number;
    residentId: number | null;
    residentName: string | null;
    planCategory: string | null;
    planDescription: string | null;
    servicesProvided: string | null;
    targetDate: string | null;
    caseConferenceDate: string | null;
    status: string | null;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface InterventionPlanUpsertRequest {
    residentId?: number | null;
    planCategory?: string | null;
    planDescription?: string | null;
    servicesProvided?: string | null;
    targetDate?: string | null;
    caseConferenceDate?: string | null;
    status?: string | null;
}

export async function getAdminInterventionPlans(options: {
    residentId?: number;
    status?: string;
    hasConference?: boolean;
} = {}): Promise<InterventionPlanItem[]> {
    const q = new URLSearchParams();
    if (options.residentId) q.set('residentId', String(options.residentId));
    if (options.status?.trim()) q.set('status', options.status.trim());
    if (options.hasConference !== undefined) q.set('hasConference', String(options.hasConference));
    const response = await apiFetch(`/api/intervention-plans${q.toString() ? `?${q}` : ''}`);
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load intervention plans.'));
    return response.json();
}

export async function createAdminInterventionPlan(payload: InterventionPlanUpsertRequest): Promise<InterventionPlanItem> {
    const response = await apiFetch('/api/intervention-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to create intervention plan.'));
    return response.json();
}

export async function updateAdminInterventionPlan(id: number, payload: InterventionPlanUpsertRequest): Promise<void> {
    const response = await apiFetch(`/api/intervention-plans/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to update intervention plan.'));
}

export async function deleteAdminInterventionPlan(id: number): Promise<void> {
    const response = await apiFetch(`/api/intervention-plans/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to delete intervention plan.'));
}

// ── Partners ──────────────────────────────────────────────────────────────────

export interface PartnerItem {
    id: number;
    partnerName: string | null;
    partnerType: string | null;
    roleType: string | null;
    contactName: string | null;
    email: string | null;
    phone: string | null;
    region: string | null;
    status: string;
    startDate: string | null;
    endDate: string | null;
    notes: string | null;
    assignmentCount: number;
}

export interface PartnerUpsertRequest {
    partnerName?: string | null;
    partnerType?: string | null;
    roleType?: string | null;
    contactName?: string | null;
    email?: string | null;
    phone?: string | null;
    region?: string | null;
    status?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    notes?: string | null;
}

export async function getAdminPartners(search = ''): Promise<PartnerItem[]> {
    const q = new URLSearchParams();
    if (search.trim()) q.set('search', search.trim());
    const response = await apiFetch(`/api/partners${q.toString() ? `?${q}` : ''}`);
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load partners.'));
    return response.json();
}

export async function createAdminPartner(payload: PartnerUpsertRequest): Promise<PartnerItem> {
    const response = await apiFetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to create partner.'));
    return response.json();
}

export async function updateAdminPartner(id: number, payload: PartnerUpsertRequest): Promise<void> {
    const response = await apiFetch(`/api/partners/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to update partner.'));
}

export async function deleteAdminPartner(id: number): Promise<void> {
    const response = await apiFetch(`/api/partners/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to delete partner.'));
}

// ── Safehouses ────────────────────────────────────────────────────────────────

export interface SafehouseItem {
    safehouseId: number;
    safehouseCode: string | null;
    name: string | null;
    region: string | null;
    city: string | null;
    province: string | null;
    country: string | null;
    openDate: string | null;
    status: string | null;
    capacityGirls: number | null;
    capacityStaff: number | null;
    currentOccupancy: number | null;
    notes: string | null;
}

export interface SafehouseUpsertRequest {
    safehouseCode?: string | null;
    name?: string | null;
    region?: string | null;
    city?: string | null;
    province?: string | null;
    country?: string | null;
    openDate?: string | null;
    status?: string | null;
    capacityGirls?: number | null;
    capacityStaff?: number | null;
    currentOccupancy?: number | null;
    notes?: string | null;
}

export async function getAdminSafehouses(): Promise<SafehouseItem[]> {
    const response = await apiFetch('/api/safehouses');
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load safehouses.'));
    return response.json();
}

export async function createAdminSafehouse(payload: SafehouseUpsertRequest): Promise<SafehouseItem> {
    const response = await apiFetch('/api/safehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to create safehouse.'));
    return response.json();
}

export async function updateAdminSafehouse(id: number, payload: SafehouseUpsertRequest): Promise<void> {
    const response = await apiFetch(`/api/safehouses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to update safehouse.'));
}

export async function deleteAdminSafehouse(id: number): Promise<void> {
    const response = await apiFetch(`/api/safehouses/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to delete safehouse.'));
}

// ── Reports ───────────────────────────────────────────────────────────────────

export interface ReportSummary {
    activeResidents: number;
    intakeCount: number;
    reintegrationCount: number;
    highRiskCount: number;
    activeSafehouses: number;
    recentDonationsLast30Days: number;
    totalResidents: number;
    totalDonors: number;
}

export interface DonationTrendItem {
    month: string;
    total: number;
    count: number;
}

export interface ResidentOutcomeStats {
    statusCounts: { status: string; count: number }[];
    riskCounts: { risk: string; count: number }[];
    categoryCounts: { category: string; count: number }[];
}

export interface SafehouseMetric {
    id: number;
    name: string;
    status: string;
    residentCount: number;
    capacity: number;
    highRiskCount: number;
}

export interface ReintegrationStats {
    total: number;
    reintegrated: number;
    inProgress: number;
    ready: number;
    notStarted: number;
    successRate: number;
    reintegrationTypeCounts: { type: string; count: number }[];
}

export async function getReportsSummary(): Promise<ReportSummary> {
    const response = await apiFetch('/api/reports/summary');
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load report summary.'));
    return response.json();
}

export async function getReportsDonationTrends(): Promise<DonationTrendItem[]> {
    const response = await apiFetch('/api/reports/donation-trends');
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load donation trends.'));
    return response.json();
}

export async function getReportsResidentOutcomes(): Promise<ResidentOutcomeStats> {
    const response = await apiFetch('/api/reports/resident-outcomes');
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load resident outcomes.'));
    return response.json();
}

export async function getReportsSafehouseMetrics(): Promise<SafehouseMetric[]> {
    const response = await apiFetch('/api/reports/safehouse-metrics');
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load safehouse metrics.'));
    return response.json();
}

export async function getReportsReintegrationRates(): Promise<ReintegrationStats> {
    const response = await apiFetch('/api/reports/reintegration-rates');
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load reintegration rates.'));
    return response.json();
}

// ── Public Impact ─────────────────────────────────────────────────────────────

export interface PublicImpactStats {
    totalServed: number;
    activeResidents: number;
    reintegrated: number;
    activeSafehouses: number;
    totalDonations: number;
    totalDonors: number;
    programStats: { label: string; count: number }[];
}

export async function getPublicImpactStats(): Promise<PublicImpactStats> {
    const response = await apiFetch('/api/public/stats');
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load impact stats.'));
    return response.json();
}

// ── Incident Reports ─────────────────────────────────────────────────────────

export interface IncidentReportListItem {
    id: number;
    residentId: number | null;
    residentName: string;
    safehouseId: number | null;
    safehouseName: string | null;
    incidentDate: string | null;
    incidentType: string | null;
    severity: string | null;
    resolved: boolean;
    followUpRequired: boolean;
    reportedBy: string | null;
}

export interface IncidentReportDetail extends IncidentReportListItem {
    description: string | null;
    responseTaken: string | null;
    resolutionDate: string | null;
}

export interface IncidentReportUpsertRequest {
    residentId?: number | null;
    safehouseId?: number | null;
    incidentDate?: string | null;
    incidentType?: string | null;
    severity?: string | null;
    description?: string | null;
    responseTaken?: string | null;
    resolved?: boolean | null;
    resolutionDate?: string | null;
    reportedBy?: string | null;
    followUpRequired?: boolean | null;
}

export async function getAdminIncidentReports(options: {
    residentId?: number;
    safehouseId?: number;
    resolved?: boolean;
    severity?: string;
    search?: string;
    page?: number;
    pageSize?: number;
} = {}): Promise<PagedResponse<IncidentReportListItem>> {
    const q = new URLSearchParams();
    if (options.residentId) q.set('residentId', String(options.residentId));
    if (options.safehouseId) q.set('safehouseId', String(options.safehouseId));
    if (options.resolved !== undefined) q.set('resolved', String(options.resolved));
    if (options.severity?.trim()) q.set('severity', options.severity.trim());
    if (options.search?.trim()) q.set('search', options.search.trim());
    if (options.page) q.set('page', String(options.page));
    if (options.pageSize) q.set('pageSize', String(options.pageSize));

    const response = await apiFetch(`/api/incident-reports${q.toString() ? `?${q}` : ''}`);
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load incident reports.'));
    return response.json();
}

export async function getAdminIncidentReport(id: number): Promise<IncidentReportDetail> {
    const response = await apiFetch(`/api/incident-reports/${id}`);
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load incident report.'));
    return response.json();
}

export async function createAdminIncidentReport(payload: IncidentReportUpsertRequest): Promise<IncidentReportDetail> {
    const response = await apiFetch('/api/incident-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to create incident report.'));
    return response.json();
}

export async function updateAdminIncidentReport(id: number, payload: IncidentReportUpsertRequest): Promise<void> {
    const response = await apiFetch(`/api/incident-reports/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to update incident report.'));
}

export async function closeAdminIncidentReport(id: number): Promise<void> {
    const response = await apiFetch(`/api/incident-reports/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to close incident report.'));
}

// ── Education Records ───────────────────────────────────────────────────────

export interface EducationRecordItem {
    id: number;
    residentId: number | null;
    residentName: string;
    recordDate: string | null;
    educationLevel: string | null;
    schoolName: string | null;
    enrollmentStatus: string | null;
    attendanceRate: number | null;
    progressPercent: number | null;
    completionStatus: string | null;
    notes: string | null;
}

export interface EducationRecordUpsertRequest {
    residentId?: number | null;
    recordDate?: string | null;
    educationLevel?: string | null;
    schoolName?: string | null;
    enrollmentStatus?: string | null;
    attendanceRate?: number | null;
    progressPercent?: number | null;
    completionStatus?: string | null;
    notes?: string | null;
}

export async function getAdminEducationRecords(options: {
    residentId?: number;
    enrollmentStatus?: string;
    completionStatus?: string;
    page?: number;
    pageSize?: number;
} = {}): Promise<PagedResponse<EducationRecordItem>> {
    const q = new URLSearchParams();
    if (options.residentId) q.set('residentId', String(options.residentId));
    if (options.enrollmentStatus?.trim()) q.set('enrollmentStatus', options.enrollmentStatus.trim());
    if (options.completionStatus?.trim()) q.set('completionStatus', options.completionStatus.trim());
    if (options.page) q.set('page', String(options.page));
    if (options.pageSize) q.set('pageSize', String(options.pageSize));

    const response = await apiFetch(`/api/education-records${q.toString() ? `?${q}` : ''}`);
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load education records.'));
    return response.json();
}

export async function createAdminEducationRecord(payload: EducationRecordUpsertRequest): Promise<EducationRecordItem> {
    const response = await apiFetch('/api/education-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to create education record.'));
    return response.json();
}

export async function updateAdminEducationRecord(id: number, payload: EducationRecordUpsertRequest): Promise<void> {
    const response = await apiFetch(`/api/education-records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to update education record.'));
}

export async function deleteAdminEducationRecord(id: number): Promise<void> {
    const response = await apiFetch(`/api/education-records/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to delete education record.'));
}

// ── Health & Wellbeing Records ──────────────────────────────────────────────

export interface HealthWellbeingRecordItem {
    id: number;
    residentId: number | null;
    residentName: string;
    recordDate: string | null;
    generalHealthScore: number | null;
    nutritionScore: number | null;
    sleepQualityScore: number | null;
    energyLevelScore: number | null;
    heightCm: number | null;
    weightKg: number | null;
    bmi: number | null;
    medicalCheckupDone: boolean;
    dentalCheckupDone: boolean;
    psychologicalCheckupDone: boolean;
    notes: string | null;
}

export interface HealthWellbeingRecordUpsertRequest {
    residentId?: number | null;
    recordDate?: string | null;
    generalHealthScore?: number | null;
    nutritionScore?: number | null;
    sleepQualityScore?: number | null;
    energyLevelScore?: number | null;
    heightCm?: number | null;
    weightKg?: number | null;
    bmi?: number | null;
    medicalCheckupDone?: boolean | null;
    dentalCheckupDone?: boolean | null;
    psychologicalCheckupDone?: boolean | null;
    notes?: string | null;
}

export async function getAdminHealthWellbeingRecords(options: {
    residentId?: number;
    medicalCheckupDone?: boolean;
    page?: number;
    pageSize?: number;
} = {}): Promise<PagedResponse<HealthWellbeingRecordItem>> {
    const q = new URLSearchParams();
    if (options.residentId) q.set('residentId', String(options.residentId));
    if (options.medicalCheckupDone !== undefined) q.set('medicalCheckupDone', String(options.medicalCheckupDone));
    if (options.page) q.set('page', String(options.page));
    if (options.pageSize) q.set('pageSize', String(options.pageSize));

    const response = await apiFetch(`/api/health-wellbeing-records${q.toString() ? `?${q}` : ''}`);
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load health and wellbeing records.'));
    return response.json();
}

export async function createAdminHealthWellbeingRecord(payload: HealthWellbeingRecordUpsertRequest): Promise<HealthWellbeingRecordItem> {
    const response = await apiFetch('/api/health-wellbeing-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to create health and wellbeing record.'));
    return response.json();
}

export async function updateAdminHealthWellbeingRecord(id: number, payload: HealthWellbeingRecordUpsertRequest): Promise<void> {
    const response = await apiFetch(`/api/health-wellbeing-records/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to update health and wellbeing record.'));
}

export async function deleteAdminHealthWellbeingRecord(id: number): Promise<void> {
    const response = await apiFetch(`/api/health-wellbeing-records/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to delete health and wellbeing record.'));
}

// ── Social Media Posts ──────────────────────────────────────────────────────

export interface SocialMediaPostItem {
    id: number;
    platform: string | null;
    platformPostId: string | null;
    postUrl: string | null;
    createdAt: string | null;
    dayOfWeek: string | null;
    postHour: number | null;
    postType: string | null;
    mediaType: string | null;
    caption: string | null;
    hashtags: string | null;
    numHashtags: number | null;
    mentionsCount: number | null;
    hasCallToAction: boolean;
    callToActionType: string | null;
    contentTopic: string | null;
    sentimentTone: string | null;
    captionLength: number | null;
    featuresResidentStory: boolean;
    campaignName: string | null;
    isBoosted: boolean;
    boostBudgetPhp: number | null;
    impressions: number | null;
    reach: number | null;
    likes: number | null;
    comments: number | null;
    shares: number | null;
    saves: number | null;
    clickThroughs: number | null;
    videoViews: number | null;
    engagementRate: number | null;
    profileVisits: number | null;
    donationReferrals: number | null;
    estimatedDonationValuePhp: number | null;
    followerCountAtPost: number | null;
    watchTimeSeconds: number | null;
    avgViewDurationSeconds: number | null;
    subscriberCountAtPost: number | null;
    forwards: number | null;
}

export interface SocialMediaPostUpsertRequest {
    platform?: string | null;
    platformPostId?: string | null;
    postUrl?: string | null;
    createdAt?: string | null;
    dayOfWeek?: string | null;
    postHour?: number | null;
    postType?: string | null;
    mediaType?: string | null;
    caption?: string | null;
    hashtags?: string | null;
    numHashtags?: number | null;
    mentionsCount?: number | null;
    hasCallToAction?: boolean | null;
    callToActionType?: string | null;
    contentTopic?: string | null;
    sentimentTone?: string | null;
    captionLength?: number | null;
    featuresResidentStory?: boolean | null;
    campaignName?: string | null;
    isBoosted?: boolean | null;
    boostBudgetPhp?: number | null;
    impressions?: number | null;
    reach?: number | null;
    likes?: number | null;
    comments?: number | null;
    shares?: number | null;
    saves?: number | null;
    clickThroughs?: number | null;
    videoViews?: number | null;
    engagementRate?: number | null;
    profileVisits?: number | null;
    donationReferrals?: number | null;
    estimatedDonationValuePhp?: number | null;
    followerCountAtPost?: number | null;
    watchTimeSeconds?: number | null;
    avgViewDurationSeconds?: number | null;
    subscriberCountAtPost?: number | null;
    forwards?: number | null;
}

export async function getAdminSocialMediaPosts(options: {
    platform?: string;
    campaign?: string;
    postType?: string;
    search?: string;
    page?: number;
    pageSize?: number;
} = {}): Promise<PagedResponse<SocialMediaPostItem>> {
    const q = new URLSearchParams();
    if (options.platform?.trim()) q.set('platform', options.platform.trim());
    if (options.campaign?.trim()) q.set('campaign', options.campaign.trim());
    if (options.postType?.trim()) q.set('postType', options.postType.trim());
    if (options.search?.trim()) q.set('search', options.search.trim());
    if (options.page) q.set('page', String(options.page));
    if (options.pageSize) q.set('pageSize', String(options.pageSize));

    const response = await apiFetch(`/api/social-media-posts${q.toString() ? `?${q}` : ''}`);
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to load social media posts.'));
    return response.json();
}

export async function createAdminSocialMediaPost(payload: SocialMediaPostUpsertRequest): Promise<SocialMediaPostItem> {
    const response = await apiFetch('/api/social-media-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to create social media post.'));
    return response.json();
}

export async function updateAdminSocialMediaPost(id: number, payload: SocialMediaPostUpsertRequest): Promise<void> {
    const response = await apiFetch(`/api/social-media-posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to update social media post.'));
}

export async function deleteAdminSocialMediaPost(id: number): Promise<void> {
    const response = await apiFetch(`/api/social-media-posts/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error(await readApiError(response, 'Unable to delete social media post.'));
}
