import 'package:flutter_test/flutter_test.dart';
import 'package:my_folio_manager/core/utils/money_format.dart';

void main() {
  group('INR', () {
    const inr = MoneyFormat(symbol: '₹', currency: 'INR');

    test('groups digits the Indian way', () {
      expect(inr.format(3000000), '₹30,00,000.00');
      expect(inr.format(12345678), '₹1,23,45,678.00');
      expect(inr.format(1500), '₹1,500.00');
    });

    test('consolidates into lakh and crore', () {
      expect(inr.consolidated.format(3000000), '₹30L');
      expect(inr.consolidated.format(3500000), '₹35L');
      expect(inr.consolidated.format(12345678), '₹1.23Cr');
      expect(inr.consolidated.format(150000), '₹1.5L');
      expect(inr.consolidated.format(1500), '₹1.5K');
    });

    test('leaves amounts under the threshold spelled out', () {
      expect(inr.consolidated.format(999), '₹999.00');
    });

    test('puts the sign outside the symbol', () {
      expect(inr.format(-2500000), '-₹25,00,000.00');
      expect(inr.consolidated.format(-2500000), '-₹25L');
    });

    test('detects INR from the symbol alone', () {
      expect(const MoneyFormat(symbol: '₹').consolidated.format(3000000), '₹30L');
      expect(const MoneyFormat(symbol: 'INR ').format(3000000), 'INR 30,00,000.00');
    });

    test('treats null as zero', () {
      expect(inr.format(null), '₹0.00');
    });
  });

  group('other currencies', () {
    const usd = MoneyFormat(symbol: '\$', currency: 'USD');

    test('keeps default grouping and the K/M/B scale', () {
      expect(usd.format(3000000), '\$3,000,000.00');
      expect(usd.consolidated.format(3000000), '\$3M');
      expect(usd.consolidated.format(12345678), '\$12.3M');
      expect(usd.consolidated.format(1500), '\$1.5K');
    });
  });

  test('quantities group by currency but keep their precision', () {
    expect(formatQuantity(1234.56789, currency: 'INR'), '1,234.5679');
    expect(formatQuantity(1234567.5, currency: 'INR'), '12,34,567.5');
  });
}
