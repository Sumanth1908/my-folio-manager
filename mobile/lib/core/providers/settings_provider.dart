import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../models/models.dart';

part 'settings_provider.g.dart';

@Riverpod(keepAlive: true)
Future<UserSettings> userSettings(UserSettingsRef ref) async {
  final response = await ApiClient.instance.dio.get(ApiEndpoints.settings);
  return UserSettings.fromJson(response.data as Map<String, dynamic>);
}

@Riverpod(keepAlive: true)
Future<List<Currency>> currencies(CurrenciesRef ref) async {
  final response = await ApiClient.instance.dio.get(ApiEndpoints.currencies);
  final list = response.data as List<dynamic>;
  return list.map((e) => Currency.fromJson(e as Map<String, dynamic>)).toList();
}

@Riverpod(keepAlive: true)
Future<Map<String, double>> exchangeRates(ExchangeRatesRef ref) async {
  final settings = await ref.watch(userSettingsProvider.future);
  final base = settings.defaultCurrency;
  
  // Frankfurter API
  final response = await ApiClient.instance.dio.get('https://api.frankfurter.dev/v1/latest?base=$base');
  final data = response.data as Map<String, dynamic>;
  final rates = data['rates'] as Map<String, dynamic>;
  
  return rates.map((key, value) => MapEntry(key, (value as num).toDouble()));
}

@riverpod
String currencySymbol(CurrencySymbolRef ref) {
  final settingsAsync = ref.watch(userSettingsProvider);
  final currencyListAsync = ref.watch(currenciesProvider);
  
  final settings = settingsAsync.valueOrNull;
  final currencyList = currencyListAsync.valueOrNull;
  
  if (settings == null || currencyList == null) return '\$';
  
  final code = settings.defaultCurrency;
  final currency = currencyList.firstWhere(
    (c) => c.code == code,
    orElse: () => Currency(code: code, name: code, symbol: code),
  );
  
  return currency.symbol;
}
