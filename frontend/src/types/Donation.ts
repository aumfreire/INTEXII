export interface DonationRecord {
    donationId: number;
    supporterId: number | null;
    donationType: string | null;
    donationDate: string | null;
    isRecurring: boolean | null;
    campaignName: string | null;
    channelSource: string | null;
    currencyCode: string | null;
    amount: number | null;
    estimatedValue: number | null;
    impactUnit: string | null;
    notes: string | null;
    referralPostId: number | null;
}

export interface RepeatDonationState {
    donationType?: string | null;
    amount?: number | null;
    notes?: string | null;
    campaignName?: string | null;
    channelSource?: string | null;
}
