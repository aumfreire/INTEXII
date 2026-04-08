export interface TwoFactorStatus {
    sharedKey: string | null;
    authenticatorUri?: string | null;
    recoveryCodesLeft: number;
    recoveryCodes: string[] | null;
    isTwoFactorEnabled: boolean;
    isMachineRemembered: boolean;
}
