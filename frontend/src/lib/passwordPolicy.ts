export const PASSWORD_MIN_LENGTH = 14;

export const PASSWORD_POLICY_MESSAGE = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;

export function meetsPasswordPolicy(value: string): boolean {
    return value.length >= PASSWORD_MIN_LENGTH;
}
