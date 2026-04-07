export interface AuthSession {
    isAuthenticated: boolean;
    userName: string | null;
    email: string | null;
    roles: string[];
}
