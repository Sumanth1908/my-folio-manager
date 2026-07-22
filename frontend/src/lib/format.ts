/**
 * Money/number formatting.
 *
 * Two things vary by currency:
 *
 * 1. Digit grouping. INR uses the Indian 2-2-3 system (`30,00,000`), everything
 *    else keeps the browser's default grouping (`3,000,000`).
 * 2. The short scale. INR consolidates into thousand/lakh/crore (`30L`, `1.23Cr`),
 *    everything else into thousand/million/billion (`3M`, `1.23B`).
 *
 * Compact output is deliberately hand-rolled rather than `Intl` `notation: 'compact'`
 * — browsers disagree on what `en-IN` compact produces (some emit `30L`, others
 * `3M`), and the lakh/crore form is the whole point here.
 */

/** Currencies that group digits the Indian way and scale in lakh/crore. */
const INDIAN_CURRENCY_CODES = new Set(['INR']);
const INDIAN_CURRENCY_SYMBOLS = new Set(['₹', 'Rs', 'Rs.', '₹.']);

const INDIAN_UNITS = [
    { divisor: 1e7, suffix: 'Cr' },
    { divisor: 1e5, suffix: 'L' },
    { divisor: 1e3, suffix: 'K' },
];

const STANDARD_UNITS = [
    { divisor: 1e12, suffix: 'T' },
    { divisor: 1e9, suffix: 'B' },
    { divisor: 1e6, suffix: 'M' },
    { divisor: 1e3, suffix: 'K' },
];

export interface AmountFormatOptions {
    /** ISO code (e.g. `INR`) — decides grouping and short scale. */
    currency?: string | null;
    /** Symbol to prefix. Also used to detect INR when no code is at hand. */
    symbol?: string | null;
    /** Shorthand for setting both min and max fraction digits. */
    decimals?: number;
    minDecimals?: number;
    maxDecimals?: number;
    /** Consolidate large values into `30L` / `3M` instead of the full number. */
    compact?: boolean;
    /** Smallest magnitude that gets consolidated. Defaults to 1,000. */
    compactFrom?: number;
    /** Render an explicit `+` in front of positive values. */
    signed?: boolean;
}

/**
 * Either argument may hold a code or a symbol — components often only have the
 * symbol in scope, and the symbol falls back to the code when a currency isn't
 * in the currencies list.
 */
function isIndianToken(token?: string | null): boolean {
    if (!token) return false;
    const t = token.trim();
    return INDIAN_CURRENCY_CODES.has(t.toUpperCase()) || INDIAN_CURRENCY_SYMBOLS.has(t);
}

/** True when the amount should use Indian grouping and the lakh/crore scale. */
export function usesIndianDigits(currency?: string | null, symbol?: string | null): boolean {
    return isIndianToken(currency) || isIndianToken(symbol);
}

/** Locale to hand to `toLocaleString`. `undefined` means "use the browser's". */
export function numberLocale(currency?: string | null, symbol?: string | null): string | undefined {
    return usesIndianDigits(currency, symbol) ? 'en-IN' : undefined;
}

function toNumber(value: number | string | null | undefined): number {
    if (value === null || value === undefined || value === '') return 0;
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : 0;
}

function resolveDecimals(options: AmountFormatOptions) {
    const { decimals, minDecimals, maxDecimals } = options;
    const min = minDecimals ?? decimals ?? 0;
    const max = maxDecimals ?? decimals ?? Math.max(min, 2);
    return { minimumFractionDigits: min, maximumFractionDigits: Math.max(min, max) };
}

/** Drops trailing zeros left over from fixed-decimal rounding: `35.40` -> `35.4`. */
function trimTrailingZeros(text: string): string {
    return text.includes('.') ? text.replace(/\.?0+$/, '') : text;
}

/**
 * Consolidates a magnitude into a unit-suffixed string, keeping roughly three
 * significant digits: `30L`, `35.4L`, `1.23Cr`.
 */
function consolidate(magnitude: number, indian: boolean): string | null {
    const units = indian ? INDIAN_UNITS : STANDARD_UNITS;
    const unit = units.find((u) => magnitude >= u.divisor);
    if (!unit) return null;

    const scaled = magnitude / unit.divisor;
    const decimals = scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
    return `${trimTrailingZeros(scaled.toFixed(decimals))}${unit.suffix}`;
}

/** Formats a number with currency-appropriate grouping, without any symbol. */
export function formatNumber(value: number | string | null | undefined, options: AmountFormatOptions = {}): string {
    const amount = toNumber(value);
    const magnitude = Math.abs(amount);
    const sign = amount < 0 ? '-' : options.signed && amount > 0 ? '+' : '';
    const indian = usesIndianDigits(options.currency, options.symbol);

    if (options.compact && magnitude >= (options.compactFrom ?? 1000)) {
        const short = consolidate(magnitude, indian);
        if (short) return `${sign}${short}`;
    }

    const locale = indian ? 'en-IN' : undefined;
    return `${sign}${magnitude.toLocaleString(locale, resolveDecimals(options))}`;
}

/** Same as {@link formatNumber}, with the currency symbol prefixed. */
export function formatCurrency(value: number | string | null | undefined, options: AmountFormatOptions = {}): string {
    const amount = toNumber(value);
    const symbol = options.symbol ?? '';
    const sign = amount < 0 ? '-' : options.signed && amount > 0 ? '+' : '';
    // Sign goes outside the symbol (`-₹500`, not `₹-500`), so format the magnitude.
    const body = formatNumber(Math.abs(amount), { ...options, signed: false });
    return `${sign}${symbol}${body}`;
}

/** Convenience wrapper for the consolidated form (`₹30L`). */
export function formatCompactCurrency(
    value: number | string | null | undefined,
    options: AmountFormatOptions = {}
): string {
    return formatCurrency(value, { ...options, compact: true });
}
