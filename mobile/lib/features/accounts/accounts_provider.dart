import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/models/models.dart';
import '../../core/providers/auth_provider.dart';

part 'accounts_provider.g.dart';

@riverpod
Future<List<Account>> accountsList(Ref ref) async {
  final authState = ref.watch(authNotifierProvider);
  if (authState.isLoading || authState.valueOrNull == null) {
    return Completer<List<Account>>().future;
  }

  final response = await ApiClient.instance.dio.get(
    ApiEndpoints.accounts,
    queryParameters: {'skip': 0, 'limit': 100},
  );
  final data = response.data as Map<String, dynamic>;
  final items = data['items'] as List<dynamic>;
  return items.map((e) => Account.fromJson(e as Map<String, dynamic>)).toList();
}

@riverpod
class AccountDetail extends _$AccountDetail {
  @override
  FutureOr<Account> build(String accountId) async {
    final authState = ref.watch(authNotifierProvider);
    if (authState.isLoading || authState.valueOrNull == null) {
      return Completer<Account>().future;
    }

    final response = await ApiClient.instance.dio.get(ApiEndpoints.account(accountId));
    return Account.fromJson(response.data as Map<String, dynamic>);
  }

  Future<void> createAccount(Map<String, dynamic> data) async {
    await ApiClient.instance.dio.post(ApiEndpoints.accounts, data: data);
    ref.invalidate(accountsListProvider);
  }

  Future<void> updateAccount(String id, Map<String, dynamic> data) async {
    await ApiClient.instance.dio.put(ApiEndpoints.account(id), data: data);
    ref.invalidateSelf();
    ref.invalidate(accountsListProvider);
  }

  Future<void> deleteAccount(String id) async {
    await ApiClient.instance.dio.delete(ApiEndpoints.account(id));
    ref.invalidate(accountsListProvider);
  }
}
@riverpod
class HoldingsNotifier extends _$HoldingsNotifier {
  @override
  FutureOr<void> build(String accountId) {}

  Future<void> buyHolding(Map<String, dynamic> data) async {
    await ApiClient.instance.dio.post(ApiEndpoints.holdings, data: data);
    ref.invalidate(accountDetailProvider(accountId));
    ref.invalidate(accountsListProvider);
  }

  Future<void> updateHolding(int id, Map<String, dynamic> data) async {
    await ApiClient.instance.dio.put(ApiEndpoints.holding(id), data: data);
    ref.invalidate(accountDetailProvider(accountId));
    ref.invalidate(accountsListProvider);
  }

  Future<void> deleteHolding(int id) async {
    await ApiClient.instance.dio.delete(ApiEndpoints.holding(id));
    ref.invalidate(accountDetailProvider(accountId));
    ref.invalidate(accountsListProvider);
  }

  Future<void> sellHolding(int id, Map<String, dynamic> data) async {
    await ApiClient.instance.dio.post(ApiEndpoints.sellHolding(id), data: data);
    ref.invalidate(accountDetailProvider(accountId));
    ref.invalidate(accountsListProvider);
  }

  Future<void> refreshPrices() async {
    await ApiClient.instance.dio.post(ApiEndpoints.refreshPrices, queryParameters: {'account_id': accountId});
    ref.invalidate(accountDetailProvider(accountId));
  }
}
