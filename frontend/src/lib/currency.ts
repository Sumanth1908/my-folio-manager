/**
 * Converts an amount into `toCurrency` using live rates quoted with `toCurrency`
 * as the base (i.e. `rates[X]` = how many units of X equal 1 unit of toCurrency).
 * Falls back to the raw amount if no rate is available — same behavior the
 * Dashboard cashflow numbers have always used. There's no historical FX data,
 * so this is a current-rate approximation for past dates, not a precise
 * point-in-time conversion.
 */
export function convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    rates: Record<string, number>
): number {
    if (fromCurrency === toCurrency) return amount;
    const rate = rates[fromCurrency];
    if (!rate) return amount;
    return amount / rate;
}

export function sumConverted(
    byCurrency: Record<string, number>,
    toCurrency: string,
    rates: Record<string, number>
): number {
    return Object.entries(byCurrency).reduce(
        (sum, [currency, amount]) => sum + convertAmount(amount, currency, toCurrency, rates),
        0
    );
}
