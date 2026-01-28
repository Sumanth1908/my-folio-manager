import { useQuery } from '@tanstack/react-query';

interface ExchangeRateResponse {
    amount: number;
    base: string;
    date: string;
    rates: Record<string, number>;
}

export function useExchangeRate(baseCurrency: string | undefined, targetCurrency: string | undefined) {
    const isEnabled = !!baseCurrency && !!targetCurrency && baseCurrency !== targetCurrency;

    const { data: rates, isLoading, error } = useQuery<ExchangeRateResponse>({
        queryKey: ['exchangeRate', baseCurrency, targetCurrency],
        queryFn: async () => {
            if (!baseCurrency || !targetCurrency) throw new Error("Currencies required");
            const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${baseCurrency}&symbols=${targetCurrency}`);
            if (!response.ok) {
                throw new Error('Failed to fetch exchange rates');
            }
            return response.json();
        },
        enabled: isEnabled,
        staleTime: 1000 * 60 * 60 * 24, // 24 hours
    });

    const getRate = () => {
        if (!isEnabled) return 1;
        if (!rates || !targetCurrency) return undefined;
        return rates.rates[targetCurrency];
    };

    const convert = (amount: number): number | null => {
        if (baseCurrency === targetCurrency) return amount;
        const rate = getRate();
        if (rate === undefined) return null;
        return amount * rate;
    };

    return {
        rate: getRate(),
        isLoading,
        error,
        convert,
        isEnabled
    };
}
