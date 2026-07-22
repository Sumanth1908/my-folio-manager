import 'package:intl/intl.dart';

/// Money/number formatting.
///
/// Two things vary by currency:
///
/// 1. Digit grouping. INR uses the Indian 2-2-3 system (`30,00,000`), everything
///    else keeps the ambient locale's grouping (`3,000,000`).
/// 2. The short scale. INR consolidates into thousand/lakh/crore (`30L`,
///    `1.23Cr`), everything else into thousand/million/billion (`3M`, `1.23B`).
///
/// Consolidation is hand-rolled rather than `NumberFormat.compactCurrency` so
/// it matches `frontend/src/lib/format.ts` exactly — `en_IN` compact otherwise
/// renders 1,500 as `1.5T` ("thousand"), which reads as "trillion".
const _indianCurrencyCodes = {'INR'};
const _indianCurrencySymbols = {'₹', 'Rs', 'Rs.', '₹.'};

class _Unit {
  const _Unit(this.divisor, this.suffix);
  final num divisor;
  final String suffix;
}

const _indianUnits = [
  _Unit(10000000, 'Cr'),
  _Unit(100000, 'L'),
  _Unit(1000, 'K'),
];

const _standardUnits = [
  _Unit(1000000000000, 'T'),
  _Unit(1000000000, 'B'),
  _Unit(1000000, 'M'),
  _Unit(1000, 'K'),
];

/// Either a code or a symbol — screens often only have one of the two, and the
/// symbol falls back to the code for currencies missing from the currency list.
bool _isIndianToken(String? token) {
  if (token == null) return false;
  final t = token.trim();
  return _indianCurrencyCodes.contains(t.toUpperCase()) ||
      _indianCurrencySymbols.contains(t);
}

String _trimTrailingZeros(String text) {
  if (!text.contains('.')) return text;
  return text.replaceFirst(RegExp(r'\.?0+$'), '');
}

/// Formats amounts for one currency. Drop-in for `NumberFormat` at call sites:
/// it exposes the same `format(value)`.
class MoneyFormat {
  const MoneyFormat({
    this.symbol = '',
    this.currency,
    this.decimalDigits = 2,
    this.compact = false,
  });

  /// Prefix as rendered — a symbol (`₹`) or a code with a trailing space (`INR `).
  final String symbol;

  /// ISO code, when the screen has it. Falls back to reading [symbol].
  final String? currency;

  final int decimalDigits;

  /// Consolidate large amounts (`₹30L`) instead of spelling them out.
  final bool compact;

  bool get _isIndian => _isIndianToken(currency) || _isIndianToken(symbol);

  /// A consolidating copy, for tight spots like cards and chart labels.
  MoneyFormat get consolidated => MoneyFormat(
        symbol: symbol,
        currency: currency,
        decimalDigits: decimalDigits,
        compact: true,
      );

  /// The full amount, ignoring [compact] — for tooltips and detail rows.
  String exact(num? value) {
    final amount = value ?? 0;
    final fmt = NumberFormat.currency(
      locale: _isIndian ? 'en_IN' : null,
      symbol: symbol,
      decimalDigits: decimalDigits,
    );
    // Sign outside the symbol (`-₹500`, not `₹-500`).
    return '${amount < 0 ? '-' : ''}${fmt.format(amount.abs())}';
  }

  String format(num? value) {
    final amount = value ?? 0;
    final magnitude = amount.abs();
    if (compact && magnitude >= 1000) {
      final short = _consolidate(magnitude, _isIndian);
      if (short != null) return '${amount < 0 ? '-' : ''}$symbol$short';
    }
    return exact(amount);
  }
}

/// Groups a bare number (no symbol) the way [currency] wants it.
String formatQuantity(num? value, {String? currency, int maxDecimals = 4}) {
  final fmt = NumberFormat.decimalPattern(
    _isIndianToken(currency) ? 'en_IN' : null,
  )..maximumFractionDigits = maxDecimals;
  return fmt.format(value ?? 0);
}

/// Keeps roughly three significant digits: `30L`, `35.4L`, `1.23Cr`.
String? _consolidate(num magnitude, bool indian) {
  for (final unit in indian ? _indianUnits : _standardUnits) {
    if (magnitude >= unit.divisor) {
      final scaled = magnitude / unit.divisor;
      final decimals = scaled < 10 ? 2 : (scaled < 100 ? 1 : 0);
      return '${_trimTrailingZeros(scaled.toStringAsFixed(decimals))}${unit.suffix}';
    }
  }
  return null;
}
