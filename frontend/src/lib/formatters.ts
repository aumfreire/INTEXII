export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
}

export function formatMoney(value: number, currencyCode = 'USD'): string {
    const normalizedCode = (currencyCode || 'USD').trim().toUpperCase();
    const safeCode = /^[A-Z]{3}$/.test(normalizedCode) ? normalizedCode : 'USD';

    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: safeCode,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    }
}
