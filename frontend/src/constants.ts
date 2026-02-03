export const ACCOUNT_TYPE = {
    SAVINGS: 'SAVINGS',
    INVESTMENT: 'INVESTMENT',
    FIXED_DEPOSIT: 'FIXED_DEPOSIT',
    LOAN: 'LOAN'
} as const;

export const ACCOUNT_TYPES = [
    ACCOUNT_TYPE.SAVINGS,
    ACCOUNT_TYPE.INVESTMENT,
    ACCOUNT_TYPE.FIXED_DEPOSIT,
    ACCOUNT_TYPE.LOAN
] as const;

export const TRANSACTION_TYPE = {
    DEBIT: 'DEBIT',
    CREDIT: 'CREDIT',
    TRANSFER: 'TRANSFER'
} as const;

export const RULE_TYPE = {
    CATEGORIZATION: 'CATEGORIZATION',
    TRANSACTION: 'TRANSACTION',
    CALCULATION: 'CALCULATION'
} as const;

export const FREQUENCY = {
    DAILY: 'DAILY',
    WEEKLY: 'WEEKLY',
    MONTHLY: 'MONTHLY',
    YEARLY: 'YEARLY',
    ONE_TIME: 'ONE_TIME'
} as const;

export const TIME_RANGES = ['thisMonth', 'lastMonth', 'allTime'] as const;

export const DEFAULT_CURRENCY = 'USD';
export const DEFAULT_ACCRUAL_DAY = '1';
