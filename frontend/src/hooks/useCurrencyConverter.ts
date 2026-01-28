import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';

interface ExchangeRateResponse {
    amount: number;
    base: string;
    date: string;
    rates: Record<string, number>;
}

export function useCurrencyConverter(targetCurrency: string | undefined) {
    const isEnabled = !!targetCurrency;

    const { data: ratesData, isLoading, error } = useQuery<ExchangeRateResponse>({
        queryKey: ['currencyConverter', targetCurrency],
        queryFn: async () => {
            if (!targetCurrency) throw new Error("Target currency required");
            const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${targetCurrency}`);
            if (!response.ok) {
                throw new Error('Failed to fetch exchange rates');
            }
            return response.json();
        },
        enabled: isEnabled,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    const convert = useCallback((amount: number, fromCurrency: string): number => {
        if (!targetCurrency || !ratesData) return amount;
        if (fromCurrency === targetCurrency) return amount;

        const rate = ratesData.rates[fromCurrency];
        if (!rate) {
            console.warn(`No rate found for ${fromCurrency} to ${targetCurrency}`);
            return amount;
        }

        return amount / rate;
    }, [targetCurrency, ratesData]);

    return useMemo(() => ({
        convert,
        isLoading,
        error,
        isEnabled
    }), [convert, isLoading, error, isEnabled]);
}
