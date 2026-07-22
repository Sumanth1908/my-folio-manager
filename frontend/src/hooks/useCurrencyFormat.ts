import { useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import type { RootState } from '../store';
import { formatCurrency, formatNumber, type AmountFormatOptions } from '../lib/format';

/**
 * Binds the money formatters to the user's default currency and the currency
 * list, so components don't each have to look the symbol up themselves.
 *
 * `money`/`compact` format in the default currency; `moneyIn`/`compactIn` take
 * an explicit currency code for amounts that aren't in it (per-account balances,
 * foreign-currency transactions).
 */
export function useCurrencyFormat() {
    const { items: currencies } = useAppSelector((state: RootState) => state.currencies);
    const { data: settings } = useAppSelector((state: RootState) => state.settings);

    const currency = settings?.default_currency || 'USD';

    return useMemo(() => {
        const symbolFor = (code?: string | null) =>
            currencies?.find((c) => c.code === code)?.symbol || code || '$';

        const symbol = symbolFor(currency);

        const moneyIn = (value: number | string | null | undefined, code?: string | null, options: AmountFormatOptions = {}) =>
            formatCurrency(value, { currency: code || currency, symbol: symbolFor(code || currency), ...options });

        return {
            currency,
            symbol,
            symbolFor,
            /** `₹30,00,000.00` — full precision, in the default currency. */
            money: (value: number | string | null | undefined, options: AmountFormatOptions = {}) =>
                moneyIn(value, currency, options),
            /** `₹30L` — consolidated, in the default currency. */
            compact: (value: number | string | null | undefined, options: AmountFormatOptions = {}) =>
                moneyIn(value, currency, { compact: true, ...options }),
            moneyIn,
            compactIn: (value: number | string | null | undefined, code?: string | null, options: AmountFormatOptions = {}) =>
                moneyIn(value, code, { compact: true, ...options }),
            /** Grouping only, no symbol. */
            number: (value: number | string | null | undefined, options: AmountFormatOptions = {}) =>
                formatNumber(value, { currency, ...options }),
        };
    }, [currencies, currency]);
}
