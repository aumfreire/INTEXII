export interface AdminUserSummary {
    id: string;
    email: string | null;
    userName: string | null;
    emailConfirmed: boolean;
    isTwoFactorEnabled: boolean;
    lockoutEnd: string | null;
    roles: string[];
}

export interface AdminUserDetail extends AdminUserSummary {
    accessFailedCount: number;
    recoveryCodesLeft: number;
}

export interface AdminUserSummaryMetrics {
    totalUsers: number;
    admins: number;
    donors: number;
    usersWithMfa: number;
}
