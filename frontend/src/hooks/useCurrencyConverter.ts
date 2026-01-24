import { useQuery } from '@tanstack/react-query';

interface ExchangeRateResponse {
    amount: number;
    base: string;
    date: string;
    rates: Record<string, number>;
}

export function useCurrencyConverter(targetCurrency: string | undefined) {
    const isEnabled = !!targetCurrency;

    // We fetch rates based on the TARGET currency.
    // e.g. Base = INR. 
    // Rates will be: USD: 0.012, EUR: 0.011
    // To convert 100 USD to INR: 100 / Rate(USD) = 100 / 0.012 = 8333 INR.
    // To convert 100 INR to INR: 100 / Rate(INR) [which is 1] = 100.
    const { data: ratesData, isLoading, error } = useQuery<ExchangeRateResponse>({
        queryKey: ['currencyConverter', targetCurrency],
        queryFn: async () => {
            if (!targetCurrency) throw new Error("Target currency required");
            // Fetch rates where base is the target currency
            const response = await fetch(`https://api.frankfurter.dev/v1/latest?base=${targetCurrency}`);
            if (!response.ok) {
                throw new Error('Failed to fetch exchange rates');
            }
            return response.json();
        },
        enabled: isEnabled,
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    const convert = (amount: number, fromCurrency: string): number => {
        if (!targetCurrency || !ratesData) return amount;
        if (fromCurrency === targetCurrency) return amount;

        const rate = ratesData.rates[fromCurrency];
        // If we don't have a rate (e.g. unknown currency), return amount as is or 0? 
        // Returning amount might be misleading if currencies are vasty different.
        // But for now, returning amount usually signals failure or same currency.
        if (!rate) {
            console.warn(`No rate found for ${fromCurrency} to ${targetCurrency}`);
            return amount;
        }

        // Calculation: Amount in Source / Rate of Source (relative to Target)
        // Wait.
        // Base = INR.
        // 1 INR = 0.012 USD.
        // Value in INR * 0.012 = Value in USD.
        // We have Value in USD (100). We want Value in INR.
        // Value in INR = Value in USD / 0.012.
        // Correct.
        return amount / rate;
    };

    return {
        convert,
        isLoading,
        error,
        isEnabled
    };
}
