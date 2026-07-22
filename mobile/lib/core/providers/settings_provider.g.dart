// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'settings_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$userSettingsHash() => r'db60b8fa5ea1e63d830c438a49e9e1ee0cf7afcc';

/// See also [userSettings].
@ProviderFor(userSettings)
final userSettingsProvider = FutureProvider<UserSettings>.internal(
  userSettings,
  name: r'userSettingsProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$userSettingsHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef UserSettingsRef = FutureProviderRef<UserSettings>;
String _$currenciesHash() => r'064f2095ccd919ff49c092dc9f245c0853fb6c58';

/// See also [currencies].
@ProviderFor(currencies)
final currenciesProvider = FutureProvider<List<Currency>>.internal(
  currencies,
  name: r'currenciesProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$currenciesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef CurrenciesRef = FutureProviderRef<List<Currency>>;
String _$exchangeRatesHash() => r'eb0e066e240039895e4c255b54b184f16715628c';

/// See also [exchangeRates].
@ProviderFor(exchangeRates)
final exchangeRatesProvider = FutureProvider<Map<String, double>>.internal(
  exchangeRates,
  name: r'exchangeRatesProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$exchangeRatesHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef ExchangeRatesRef = FutureProviderRef<Map<String, double>>;
String _$currencySymbolHash() => r'e8be79140be2c2101535daac6e18cfd3646a53e0';

/// See also [currencySymbol].
@ProviderFor(currencySymbol)
final currencySymbolProvider = AutoDisposeProvider<String>.internal(
  currencySymbol,
  name: r'currencySymbolProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$currencySymbolHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef CurrencySymbolRef = AutoDisposeProviderRef<String>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
