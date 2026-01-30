export const ACCOUNT_TYPE = {
    SAVINGS: 'Savings',
    INVESTMENT: 'Investment',
    FIXED_DEPOSIT: 'Fixed Deposit',
    LOAN: 'Loan'
} as const;

export const ACCOUNT_TYPES = [
    ACCOUNT_TYPE.SAVINGS,
    ACCOUNT_TYPE.INVESTMENT,
    ACCOUNT_TYPE.FIXED_DEPOSIT,
    ACCOUNT_TYPE.LOAN
] as const;

export const TIME_RANGES = ['thisMonth', 'lastMonth', 'allTime'] as const;

export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_ACCRUAL_DAY = '1';
