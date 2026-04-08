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

export interface ExternalAuthProvider {
    name: string;
    displayName: string;
}

export interface ManagedProfile {
    firstName: string | null;
    lastName: string | null;
    displayName: string;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '';

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
    const response = await fetch(`${apiBaseUrl}/api/auth/manage/2fa`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
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
    const response = await fetch(`${apiBaseUrl}/api/auth/providers`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to load external login providers.')
        );
    }

    return response.json();
}

export async function getAuthSession(): Promise<AuthSession> {
    const response = await fetch(`${apiBaseUrl}/api/auth/me`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error('Unable to load auth session.');
    }

    return response.json();
}

export async function registerUser(email: string, password: string): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
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
    rememberMe: boolean,
    twoFactorCode?: string,
    twoFactorRecoveryCode?: string
): Promise<void> {
    const searchParams = new URLSearchParams();

    if (rememberMe) {
        searchParams.set('useCookies', 'true');
    } else {
        searchParams.set('useSessionCookies', 'true');
    }

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

    const response = await fetch(`${apiBaseUrl}/api/auth/login?${searchParams.toString()}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
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
}

export async function logoutUser(): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    });

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
    const response = await fetch(`${apiBaseUrl}/api/auth/manage/info`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
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
    const response = await fetch(`${apiBaseUrl}/api/auth/manage/profile`, {
        credentials: 'include',
    });

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
    const response = await fetch(`${apiBaseUrl}/api/auth/manage/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
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
    const response = await fetch(`${apiBaseUrl}/api/admin/users/summary`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to load admin dashboard metrics.')
        );
    }

    return response.json();
}

export async function getAdminDonationSummary(): Promise<AdminDonationSummary> {
    const response = await fetch(`${apiBaseUrl}/api/donations/admin/summary`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(
            await readApiError(response, 'Unable to load donation metrics.')
        );
    }

    return response.json();
}

export async function listAdminUsers(search = ''): Promise<AdminUserSummary[]> {
    const query = new URLSearchParams();
    if (search.trim().length > 0) {
        query.set('search', search.trim());
    }

    const response = await fetch(
        `${apiBaseUrl}/api/admin/users${query.toString() ? `?${query.toString()}` : ''}`,
        {
            credentials: 'include',
        }
    );

    if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to load users.'));
    }

    return response.json();
}

export async function getAdminUserById(userId: string): Promise<AdminUserDetail> {
    const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}`, {
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to load user details.'));
    }

    return response.json();
}

export async function adminCreateUser(
    payload: AdminCreateUserRequest
): Promise<AdminCreateUserResponse> {
    const response = await fetch(`${apiBaseUrl}/api/admin/users`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
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
    const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
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
    const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ newPassword }),
    });

    if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to reset password.'));
    }
}

export async function adminResetUserMfa(userId: string): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/mfa/reset`, {
        method: 'POST',
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to reset MFA.'));
    }
}

export async function adminUpdateUserRoles(userId: string, roles: string[]): Promise<string[]> {
    const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}/roles`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ roles }),
    });

    if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to update roles.'));
    }

    const payload = await response.json();
    return Array.isArray(payload.roles) ? payload.roles : [];
}

export async function deleteAdminUser(userId: string): Promise<void> {
    const response = await fetch(`${apiBaseUrl}/api/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
    });

    if (!response.ok) {
        throw new Error(await readApiError(response, 'Unable to delete user.'));
    }
}
