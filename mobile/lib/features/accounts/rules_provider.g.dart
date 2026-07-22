// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'rules_provider.dart';

// **************************************************************************
// RiverpodGenerator
// **************************************************************************

String _$accountRulesHash() => r'75d623a83015c3d259dd6a62d211a1f58b4de857';

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

abstract class _$AccountRules
    extends BuildlessAutoDisposeAsyncNotifier<List<Rule>> {
  late final String accountId;

  FutureOr<List<Rule>> build(
    String accountId,
  );
}

/// See also [AccountRules].
@ProviderFor(AccountRules)
const accountRulesProvider = AccountRulesFamily();

/// See also [AccountRules].
class AccountRulesFamily extends Family<AsyncValue<List<Rule>>> {
  /// See also [AccountRules].
  const AccountRulesFamily();

  /// See also [AccountRules].
  AccountRulesProvider call(
    String accountId,
  ) {
    return AccountRulesProvider(
      accountId,
    );
  }

  @override
  AccountRulesProvider getProviderOverride(
    covariant AccountRulesProvider provider,
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
  String? get name => r'accountRulesProvider';
}

/// See also [AccountRules].
class AccountRulesProvider
    extends AutoDisposeAsyncNotifierProviderImpl<AccountRules, List<Rule>> {
  /// See also [AccountRules].
  AccountRulesProvider(
    String accountId,
  ) : this._internal(
          () => AccountRules()..accountId = accountId,
          from: accountRulesProvider,
          name: r'accountRulesProvider',
          debugGetCreateSourceHash:
              const bool.fromEnvironment('dart.vm.product')
                  ? null
                  : _$accountRulesHash,
          dependencies: AccountRulesFamily._dependencies,
          allTransitiveDependencies:
              AccountRulesFamily._allTransitiveDependencies,
          accountId: accountId,
        );

  AccountRulesProvider._internal(
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
  FutureOr<List<Rule>> runNotifierBuild(
    covariant AccountRules notifier,
  ) {
    return notifier.build(
      accountId,
    );
  }

  @override
  Override overrideWith(AccountRules Function() create) {
    return ProviderOverride(
      origin: this,
      override: AccountRulesProvider._internal(
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
  AutoDisposeAsyncNotifierProviderElement<AccountRules, List<Rule>>
      createElement() {
    return _AccountRulesProviderElement(this);
  }

  @override
  bool operator ==(Object other) {
    return other is AccountRulesProvider && other.accountId == accountId;
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
mixin AccountRulesRef on AutoDisposeAsyncNotifierProviderRef<List<Rule>> {
  /// The parameter `accountId` of this provider.
  String get accountId;
}

class _AccountRulesProviderElement
    extends AutoDisposeAsyncNotifierProviderElement<AccountRules, List<Rule>>
    with AccountRulesRef {
  _AccountRulesProviderElement(super.provider);

  @override
  String get accountId => (origin as AccountRulesProvider).accountId;
}
// ignore_for_file: type=lint
// ignore_for_file: subtype_of_sealed_class, invalid_use_of_internal_member, invalid_use_of_visible_for_testing_member, deprecated_member_use_from_same_package
