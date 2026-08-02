import { HOLDING_ACCOUNT_TYPES } from '../constants';
import type { Account, InvestmentHolding } from '../types';

const holdingAccountTypes = new Set<string>(HOLDING_ACCOUNT_TYPES);

export const getAccountHoldings = (account: Account): InvestmentHolding[] =>
    account.asset_holdings ?? account.investment_holdings ?? [];

export const accountSupportsHoldings = (account: Account): boolean =>
    holdingAccountTypes.has(account.account_type)
    || account.metadata_?.supports_holdings === true
    || getAccountHoldings(account).length > 0;

export const getRecurringDepositScheduleDay = (account: Account): number | null => {
    const startDate = account.metadata_?.start_date;
    if (typeof startDate === 'string') {
        const day = Number.parseInt(startDate.substring(8, 10), 10);
        if (Number.isInteger(day) && day >= 1 && day <= 31) return day;
    }

    return null;
};

export const getAccountDisplayValue = (account: Account): number => {
    if (account.net_value !== undefined && account.net_value !== null) {
        return Number(account.net_value);
    }
    if (accountSupportsHoldings(account)) {
        return getAccountHoldings(account).reduce((total, holding) => {
            const price = Number(holding.current_price ?? holding.average_price ?? 0);
            return total + Number(holding.quantity || 0) * price;
        }, 0);
    }
    return Number(account.balance || 0);
};

export const formatAccountType = (accountType: string): string =>
    accountType.toLowerCase().split('_').map((word) => (
        word.charAt(0).toUpperCase() + word.slice(1)
    )).join(' ');

export const defaultAssetTypeForAccount = (accountType: string): string => {
    switch (accountType) {
        case 'COMMODITY': return 'GOLD';
        case 'CRYPTO': return 'CRYPTO';
        case 'REAL_ESTATE': return 'REAL_ESTATE';
        case 'OTHER_ASSET': return 'OTHER';
        default: return 'EQUITY';
    }
};
