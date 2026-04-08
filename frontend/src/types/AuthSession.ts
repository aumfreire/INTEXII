export interface AuthSession {
    isAuthenticated: boolean;
    displayName: string | null;
    userName: string | null;
    email: string | null;
    hasLocalPassword: boolean;
    isExternalOnly: boolean;
    externalLoginProviders: string[];
    roles: string[];
}
