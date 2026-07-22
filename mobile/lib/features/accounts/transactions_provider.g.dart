// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'transactions_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$accountTransactionsHash() =>
    r'41a2bbf4cf0ab980c472cc90fed1bf58999c3ee7';

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

abstract class _$AccountTransactions
    extends BuildlessAutoDisposeAsyncNotifier<List<Transaction>> {
  late final String accountId;

  FutureOr<List<Transaction>> build(
    String accountId,
  );
}

/// See also [AccountTransactions].
@ProviderFor(AccountTransactions)
const accountTransactionsProvider = AccountTransactionsFamily();

/// See also [AccountTransactions].
class AccountTransactionsFamily extends Family<AsyncValue<List<Transaction>>> {
  /// See also [AccountTransactions].
  const AccountTransactionsFamily();

  /// See also [AccountTransactions].
  AccountTransactionsProvider call(
    String accountId,
  ) {
    return AccountTransactionsProvider(
      accountId,
    );
  }

  @override
  AccountTransactionsProvider getProviderOverride(
    covariant AccountTransactionsProvider provider,
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
  String? get name => r'accountTransactionsProvider';
}

/// See also [AccountTransactions].
class AccountTransactionsProvider extends AutoDisposeAsyncNotifierProviderImpl<
    AccountTransactions, List<Transaction>> {
  /// See also [AccountTransactions].
  AccountTransactionsProvider(
    String accountId,
  ) : this._internal(
          () => AccountTransactions()..accountId = accountId,
          from: accountTransactionsProvider,
          name: r'accountTransactionsProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$accountTransactionsHash,
          dependencies: AccountTransactionsFamily._dependencies,
          allTransitiveDependencies:
              AccountTransactionsFamily._allTransitiveDependencies,
          accountId: accountId,
        );

  AccountTransactionsProvider._internal(
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
  FutureOr<List<Transaction>> runNotifierBuild(
    covariant AccountTransactions notifier,
  ) {
    return notifier.build(
      accountId,
    );
  }

  @override
  Override overrideWith(AccountTransactions Function() create) {
    return ProviderOverride(
      origin: this,
      override: AccountTransactionsProvider._internal(
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
  AutoDisposeAsyncNotifierProviderElement<AccountTransactions,
      List<Transaction>> createElement() {
    return _AccountTransactionsProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is AccountTransactionsProvider && other.accountId == accountId;
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
mixin AccountTransactionsRef
    on AutoDisposeAsyncNotifierProviderRef<List<Transaction>> {
  /// The parameter `accountId` of this provider.
  String get accountId;
}

class _AccountTransactionsProviderElement
    extends AutoDisposeAsyncNotifierProviderElement<AccountTransactions,
        List<Transaction>> with AccountTransactionsRef {
  _AccountTransactionsProviderElement(super.provider);

  @override
  String get accountId => (origin as AccountTransactionsProvider).accountId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
