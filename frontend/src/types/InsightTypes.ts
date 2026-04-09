export type RiskTier = 'High' | 'Medium' | 'Low';
export type AlertTier = 'Alert' | 'Watch' | 'Stable';
export type EngagementTier = 'High' | 'Medium' | 'Low';

export interface InsightResponse<T> {
    runDate: string | null;
    data: T[];
}

export interface DonorLapseRecord {
    supporterId: number;
    displayName: string | null;
    email: string | null;
    phone: string | null;
    supporterType: string | null;
    relationshipType: string | null;
    region: string | null;
    country: string | null;
    snapshotDate: string | null;
    lapseRiskScore: number | null;
    riskTier: RiskTier | null;
    recencyDays: number | null;
    frequency: number | null;
    valueSum: number | null;
    topChannelSource: string | null;
    topDonationType: string | null;
}

export interface SafehouseHealthRecord {
    safehouseId: number;
    safehouseCode: string | null;
    name: string | null;
    region: string | null;
    monthStart: string | null;
    predAvgEducationProgress: number | null;
    predAvgHealthScore: number | null;
    predIncidentCount: number | null;
    alertTier: AlertTier | null;
}

export interface ResidentRiskRecord {
    residentId: number;
    caseControlNo: string | null;
    internalCode: string | null;
    safehouseId: number | null;
    caseCategory: string | null;
    currentRiskLevel: string | null;
    healthRisk: RiskTier | null;
    healthRiskReason: string | null;
    educationRisk: RiskTier | null;
    educationRiskReason: string | null;
    incidentRisk: RiskTier | null;
    incidentRiskReason: string | null;
    overallRisk: RiskTier | null;
    lastHealthScore: number | null;
    lastAttendanceRate: number | null;
    lastProgressPercent: number | null;
    incidentsLast30d: number | null;
    incidentsLast90d: number | null;
    activePlanStatus: string | null;
    planTargetDate: string | null;
}

export interface SocialEngagementRecord {
    supporterId: number;
    displayName: string | null;
    email: string | null;
    phone: string | null;
    engagementTier: EngagementTier | null;
    engagementProbability: number | null;
    suggestedAction: string | null;
    recencyDays: number | null;
    donationFrequency: number | null;
    donationValueSum: number | null;
    referralLinkedDonations: number | null;
    preferredPlatform: string | null;
    preferredTopic: string | null;
    acquisitionChannel: string | null;
    supporterType: string | null;
    region: string | null;
    country: string | null;
}
