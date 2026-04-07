export interface AdminUserSummary {
    id: string;
    email: string | null;
    userName: string | null;
    preferredDisplayName: string;
    emailConfirmed: boolean;
    isTwoFactorEnabled: boolean;
    lockoutEnd: string | null;
    roles: string[];
    hasLocalPassword: boolean;
    isExternalOnly: boolean;
    externalLoginProviders: string[];
    supporterType: string | null;
    totalDonationCount: number;
    totalMonetaryAmount: number;
    totalEstimatedValue: number;
}

export interface AdminUserDetail extends AdminUserSummary {
    accessFailedCount: number;
    recoveryCodesLeft: number;
    supporter: SupporterDetail | null;
    donationSummary: DonationSummary;
    recentDonations: RecentDonation[];
}

export interface AdminUserSummaryMetrics {
    totalUsers: number;
    admins: number;
    donors: number;
    usersWithMfa: number;
}

export interface SupporterDetail {
    supporterId: number;
    supporterType: string | null;
    displayName: string | null;
    organizationName: string | null;
    firstName: string | null;
    lastName: string | null;
    relationshipType: string | null;
    region: string | null;
    country: string | null;
    email: string | null;
    phone: string | null;
    status: string | null;
    createdAt: string | null;
    firstDonationDate: string | null;
    acquisitionChannel: string | null;
}

export interface DonationSummary {
    totalDonationCount: number;
    totalMonetaryAmount: number;
    totalEstimatedValue: number;
    lastDonationDate: string | null;
}

export interface RecentDonation {
    donationId: number;
    donationDate: string | null;
    donationType: string | null;
    channelSource: string | null;
    campaignName: string | null;
    amount: number | null;
    estimatedValue: number | null;
    currencyCode: string | null;
}

export interface AdminDonationSummary {
    totalDonationCount: number;
    totalMonetaryAmount: number;
    totalEstimatedValue: number;
    latestDonationDate: string | null;
}

export interface AdminCreateUserRequest {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    displayName?: string;
    makeAdmin: boolean;
}

export interface AdminCreateUserResponse {
    userId: string;
    email: string | null;
    roles: string[];
}

export interface AdminUpdateProfileRequest {
    firstName?: string;
    lastName?: string;
    displayName?: string;
}
