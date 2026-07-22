// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'accounts_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$accountsListHash() => r'fc2eaf65568b2b8ede1e44a517e5032b35349798';

/// See also [accountsList].
@ProviderFor(accountsList)
final accountsListProvider = AutoDisposeFutureProvider<List<Account>>.internal(
  accountsList,
  name: r'accountsListProvider',
  debugGetCreateSourceHash:
      const bool.fromEnvironment('dart.vm.product') ? null : _$accountsListHash,
  dependencies: null,
  allTransitiveDependencies: null,
);

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
typedef AccountsListRef = AutoDisposeFutureProviderRef<List<Account>>;
String _$accountDetailHash() => r'e3aba1cf22adfd941c2578d9059d327f1818be88';

/// Copied from Dart SDK
class _SystemHash {
  _SystemHash._();

  static int combine(int hash, int value) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + value);
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x0007ffff & hash) << 10));
    return hash ^ (hash >> 6);
  }

  static int finish(int hash) {
    // ignore: parameter_assignments
    hash = 0x1fffffff & (hash + ((0x03ffffff & hash) << 3));
    // ignore: parameter_assignments
    hash = hash ^ (hash >> 11);
    return 0x1fffffff & (hash + ((0x00003fff & hash) << 15));
  }
}

abstract class _$AccountDetail
    extends BuildlessAutoDisposeAsyncNotifier<Account> {
  late final String accountId;

  FutureOr<Account> build(
    String accountId,
  );
}

/// See also [AccountDetail].
@ProviderFor(AccountDetail)
const accountDetailProvider = AccountDetailFamily();

/// See also [AccountDetail].
class AccountDetailFamily extends Family<AsyncValue<Account>> {
  /// See also [AccountDetail].
  const AccountDetailFamily();

  /// See also [AccountDetail].
  AccountDetailProvider call(
    String accountId,
  ) {
    return AccountDetailProvider(
      accountId,
    );
  }

  @override
  AccountDetailProvider getProviderOverride(
    covariant AccountDetailProvider provider,
  ) {
    return call(
      provider.accountId,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'accountDetailProvider';
}

/// See also [AccountDetail].
class AccountDetailProvider
    extends AutoDisposeAsyncNotifierProviderImpl<AccountDetail, Account> {
  /// See also [AccountDetail].
  AccountDetailProvider(
    String accountId,
  ) : this._internal(
          () => AccountDetail()..accountId = accountId,
          from: accountDetailProvider,
          name: r'accountDetailProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$accountDetailHash,
          dependencies: AccountDetailFamily._dependencies,
          allTransitiveDependencies:
              AccountDetailFamily._allTransitiveDependencies,
          accountId: accountId,
        );

  AccountDetailProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.accountId,
  }) : super.internal();

  final String accountId;

  @override
  FutureOr<Account> runNotifierBuild(
    covariant AccountDetail notifier,
  ) {
    return notifier.build(
      accountId,
    );
  }

  @override
  Override overrideWith(AccountDetail Function() create) {
    return ProviderOverride(
      origin: this,
      override: AccountDetailProvider._internal(
        () => create()..accountId = accountId,
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        accountId: accountId,
      ),
    );
  }

  @override
  AutoDisposeAsyncNotifierProviderElement<AccountDetail, Account>
      createElement() {
    return _AccountDetailProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is AccountDetailProvider && other.accountId == accountId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, accountId.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin AccountDetailRef on AutoDisposeAsyncNotifierProviderRef<Account> {
  /// The parameter `accountId` of this provider.
  String get accountId;
}

class _AccountDetailProviderElement
    extends AutoDisposeAsyncNotifierProviderElement<AccountDetail, Account>
    with AccountDetailRef {
  _AccountDetailProviderElement(super.provider);

  @override
  String get accountId => (origin as AccountDetailProvider).accountId;
}

String _$holdingsNotifierHash() => r'10fe37470dcab08ccc632bffa846631833cf23b4';

abstract class _$HoldingsNotifier
    extends BuildlessAutoDisposeAsyncNotifier<void> {
  late final String accountId;

  FutureOr<void> build(
    String accountId,
  );
}

/// See also [HoldingsNotifier].
@ProviderFor(HoldingsNotifier)
const holdingsNotifierProvider = HoldingsNotifierFamily();

/// See also [HoldingsNotifier].
class HoldingsNotifierFamily extends Family<AsyncValue<void>> {
  /// See also [HoldingsNotifier].
  const HoldingsNotifierFamily();

  /// See also [HoldingsNotifier].
  HoldingsNotifierProvider call(
    String accountId,
  ) {
    return HoldingsNotifierProvider(
      accountId,
    );
  }

  @override
  HoldingsNotifierProvider getProviderOverride(
    covariant HoldingsNotifierProvider provider,
  ) {
    return call(
      provider.accountId,
    );
  }

  static const Iterable<ProviderOrFamily>? _dependencies = null;

  @override
  Iterable<ProviderOrFamily>? get dependencies => _dependencies;

  static const Iterable<ProviderOrFamily>? _allTransitiveDependencies = null;

  @override
  Iterable<ProviderOrFamily>? get allTransitiveDependencies =>
      _allTransitiveDependencies;

  @override
  String? get name => r'holdingsNotifierProvider';
}

/// See also [HoldingsNotifier].
class HoldingsNotifierProvider
    extends AutoDisposeAsyncNotifierProviderImpl<HoldingsNotifier, void> {
  /// See also [HoldingsNotifier].
  HoldingsNotifierProvider(
    String accountId,
  ) : this._internal(
          () => HoldingsNotifier()..accountId = accountId,
          from: holdingsNotifierProvider,
          name: r'holdingsNotifierProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$holdingsNotifierHash,
          dependencies: HoldingsNotifierFamily._dependencies,
          allTransitiveDependencies:
              HoldingsNotifierFamily._allTransitiveDependencies,
          accountId: accountId,
        );

  HoldingsNotifierProvider._internal(
    super._createNotifier, {
    required super.name,
    required super.dependencies,
    required super.allTransitiveDependencies,
    required super.debugGetCreateSourceHash,
    required super.from,
    required this.accountId,
  }) : super.internal();

  final String accountId;

  @override
  FutureOr<void> runNotifierBuild(
    covariant HoldingsNotifier notifier,
  ) {
    return notifier.build(
      accountId,
    );
  }

  @override
  Override overrideWith(HoldingsNotifier Function() create) {
    return ProviderOverride(
      origin: this,
      override: HoldingsNotifierProvider._internal(
        () => create()..accountId = accountId,
        from: from,
        name: null,
        dependencies: null,
        allTransitiveDependencies: null,
        debugGetCreateSourceHash: null,
        accountId: accountId,
      ),
    );
  }

  @override
  AutoDisposeAsyncNotifierProviderElement<HoldingsNotifier, void>
      createElement() {
    return _HoldingsNotifierProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is HoldingsNotifierProvider && other.accountId == accountId;
  }

  @override
  int get hashCode {
    var hash = _SystemHash.combine(0, runtimeType.hashCode);
    hash = _SystemHash.combine(hash, accountId.hashCode);

    return _SystemHash.finish(hash);
  }
}

@Deprecated('Will be removed in 3.0. Use Ref instead')
// ignore: unused_element
mixin HoldingsNotifierRef on AutoDisposeAsyncNotifierProviderRef<void> {
  /// The parameter `accountId` of this provider.
  String get accountId;
}

class _HoldingsNotifierProviderElement
    extends AutoDisposeAsyncNotifierProviderElement<HoldingsNotifier, void>
    with HoldingsNotifierRef {
  _HoldingsNotifierProviderElement(super.provider);

  @override
  String get accountId => (origin as HoldingsNotifierProvider).accountId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
