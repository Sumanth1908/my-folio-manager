import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:my_folio_manager/core/api/api_client.dart';
import 'package:my_folio_manager/core/api/api_endpoints.dart';
import 'package:my_folio_manager/core/models/models.dart';

part 'categories_provider.g.dart';

@riverpod
class CategoriesList extends _$CategoriesList {
  @override
  Future<List<Category>> build() async {
    final response = await ApiClient.instance.dio.get(ApiEndpoints.categories);
    final items = response.data as List<dynamic>;
    return items.map((e) => Category.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> addCategory(String name) async {
    await ApiClient.instance.dio.post(ApiEndpoints.categories, data: {'name': name});
    ref.invalidateSelf();
  }

  Future<void> deleteCategory(int id) async {
    await ApiClient.instance.dio.delete('${ApiEndpoints.categories}$id');
    ref.invalidateSelf();
  }
}
