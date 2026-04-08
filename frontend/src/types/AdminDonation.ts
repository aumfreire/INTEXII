export interface DonationSupporterOption {
    supporterId: number;
    displayName: string | null;
    email: string | null;
    firstName: string | null;
    lastName: string | null;
    organizationName: string | null;
    supporterType: string | null;
    status: string | null;
}

export interface DonationUpsertRequest {
    supporterId?: number | null;
    supporterEmail?: string | null;
    supporterFirstName?: string | null;
    supporterLastName?: string | null;
    supporterDisplayName?: string | null;
    supporterOrganizationName?: string | null;
    supporterType?: string | null;
    supporterStatus?: string | null;
    donationType?: string | null;
    donationDate?: string | null;
    isRecurring?: boolean | null;
    campaignName?: string | null;
    channelSource?: string | null;
    currencyCode?: string | null;
    amount?: number | null;
    estimatedValue?: number | null;
    impactUnit?: string | null;
    notes?: string | null;
    referralPostId?: number | null;
}
