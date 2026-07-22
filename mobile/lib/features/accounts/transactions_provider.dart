import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/models/models.dart';

part 'transactions_provider.g.dart';

@riverpod
class AccountTransactions extends _$AccountTransactions {
  @override
  FutureOr<List<Transaction>> build(String accountId) async {
    final response = await ApiClient.instance.dio.get(
      ApiEndpoints.transactions,
      queryParameters: {'account_id': accountId, 'limit': 100},
    );
    final data = response.data as Map<String, dynamic>;
    final items = data['items'] as List<dynamic>;
    return items.map((e) => Transaction.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> createTransaction(Map<String, dynamic> data) async {
    await ApiClient.instance.dio.post(ApiEndpoints.transactions, data: data);
    ref.invalidateSelf();
  }

  Future<void> updateTransaction(int id, Map<String, dynamic> data) async {
    await ApiClient.instance.dio.put(ApiEndpoints.transaction(id), data: data);
    ref.invalidateSelf();
  }

  Future<void> deleteTransaction(int id) async {
    await ApiClient.instance.dio.delete(ApiEndpoints.transaction(id));
    ref.invalidateSelf();
  }
}
