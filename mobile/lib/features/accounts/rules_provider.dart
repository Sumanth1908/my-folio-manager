import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/models/models.dart';

part 'rules_provider.g.dart';

@riverpod
class AccountRules extends _$AccountRules {
  @override
  FutureOr<List<Rule>> build(String accountId) async {
    final response = await ApiClient.instance.dio.get(
      ApiEndpoints.rules,
      queryParameters: {'account_id': accountId},
    );
    final items = response.data as List<dynamic>;
    return items.map((e) => Rule.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> createRule(Map<String, dynamic> data) async {
    await ApiClient.instance.dio.post(ApiEndpoints.rules, data: data);
    ref.invalidateSelf();
  }

  Future<void> updateRule(int id, Map<String, dynamic> data) async {
    await ApiClient.instance.dio.patch(ApiEndpoints.rule(id), data: data);
    ref.invalidateSelf();
  }

  Future<void> deleteRule(int id) async {
    await ApiClient.instance.dio.delete(ApiEndpoints.rule(id));
    ref.invalidateSelf();
  }

  Future<void> executeRule(int id) async {
    await ApiClient.instance.dio.post(ApiEndpoints.executeRule(id));
    ref.invalidateSelf();
  }

  Future<void> toggleRule(int id, bool active) async {
    await ApiClient.instance.dio.patch(ApiEndpoints.rule(id), data: {'is_active': active});
    ref.invalidateSelf();
  }
}
