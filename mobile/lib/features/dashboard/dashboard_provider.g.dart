// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'dashboard_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$dashboardSummaryHash() => r'f29859de5ddb9f5063f09365c4ddf3dbee3f5a34';

/// See also [dashboardSummary].
@ProviderFor(dashboardSummary)
final dashboardSummaryProvider =
    AutoDisposeFutureProvider<SummaryResponse>.internal(
  dashboardSummary,
  name: r'dashboardSummaryProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$dashboardSummaryHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef DashboardSummaryRef = AutoDisposeFutureProviderRef<SummaryResponse>;
String _$dashboardTimeRangeNotifierHash() =>
    r'd037cfc92fd92026af6bcbaa206916448371a9ba';

/// See also [DashboardTimeRangeNotifier].
@ProviderFor(DashboardTimeRangeNotifier)
final dashboardTimeRangeNotifierProvider = AutoDisposeNotifierProvider<
    DashboardTimeRangeNotifier, DashboardTimeRange>.internal(
  DashboardTimeRangeNotifier.new,
  name: r'dashboardTimeRangeNotifierProvider',
  debugGetCreateSourceHash: const bool.fromEnvironment('dart.vm.product')
      ? null
      : _$dashboardTimeRangeNotifierHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

typedef _$DashboardTimeRangeNotifier = AutoDisposeNotifier<DashboardTimeRange>;
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
