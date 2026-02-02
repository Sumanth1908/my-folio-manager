import { useAppSelector } from '../store/hooks';
import type { RootState } from '../store';

export function useExchangeRate(baseCurrency: string | undefined, targetCurrency: string | undefined) {
    const { base, rates, loading, error } = useAppSelector((state: RootState) => state.converter);

    const isEnabled = !!baseCurrency && !!targetCurrency && baseCurrency !== targetCurrency;

    const getRate = (): number | undefined => {
        if (!isEnabled) return 1;
        if (!base || !rates || !baseCurrency || !targetCurrency) return undefined;

        // If base currency matches the store's base currency
        if (base === baseCurrency) {
            return rates[targetCurrency];
        }

        // If target currency matches the store's base currency
        if (base === targetCurrency) {
            const rate = rates[baseCurrency];
            return rate ? 1 / rate : undefined;
        }

        // Cross rate calculation via the store's base currency
        // 1 StoreBase = X BaseCurrency
        // 1 StoreBase = Y TargetCurrency
        // Rate (Base -> Target) = Y / X
        const rateBase = rates[baseCurrency];
        const rateTarget = rates[targetCurrency];

        if (rateBase && rateTarget) {
            return rateTarget / rateBase;
        }

        return undefined;
    };

    const rate = getRate();

    const convert = (amount: number): number | null => {
        if (baseCurrency === targetCurrency) return amount;
        if (rate === undefined) return null;
        return amount * rate;
    };

    return {
        rate,
        isLoading: loading,
        error,
        convert,
        isEnabled
    };
}
