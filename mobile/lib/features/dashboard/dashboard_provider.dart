import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/models/models.dart';
import '../../core/providers/auth_provider.dart';

part 'dashboard_provider.g.dart';

enum DashboardTimeRange {
  thisMonth,
  lastMonth,
  allTime,
}

@riverpod
class DashboardTimeRangeNotifier extends _$DashboardTimeRangeNotifier {
  @override
  DashboardTimeRange build() => DashboardTimeRange.thisMonth;

  void setRange(DashboardTimeRange range) => state = range;
}

@riverpod
Future<SummaryResponse> dashboardSummary(Ref ref) async {
  // Wait for login to be fully resolved
  final authState = ref.watch(authNotifierProvider);
  if (authState.isLoading || authState.valueOrNull == null) {
    return Completer<SummaryResponse>().future;
  }

  final range = ref.watch(dashboardTimeRangeNotifierProvider);
  final Map<String, dynamic> params = {};

  if (range == DashboardTimeRange.thisMonth) {
    final now = DateTime.now();
    final thirtyDaysAgo = now.subtract(const Duration(days: 29));
    final fromDate = DateTime(thirtyDaysAgo.year, thirtyDaysAgo.month, thirtyDaysAgo.day, 0, 0, 0);
    final toDate = DateTime(now.year, now.month, now.day, 23, 59, 59, 999);
    
    params['from_date'] = fromDate.toUtc().toIso8601String();
    params['to_date'] = toDate.toUtc().toIso8601String();
  } else if (range == DashboardTimeRange.lastMonth) {
    final now = DateTime.now();
    final firstDayLastMonth = DateTime(now.year, now.month - 1, 1);
    final lastDayLastMonth = DateTime(now.year, now.month, 0, 23, 59, 59);
    
    params['from_date'] = firstDayLastMonth.toUtc().toIso8601String();
    params['to_date'] = lastDayLastMonth.toUtc().toIso8601String();
  }

  final response = await ApiClient.instance.dio.get(
    ApiEndpoints.accountsSummary,
    queryParameters: params,
  );
  return SummaryResponse.fromJson(response.data as Map<String, dynamic>);
}
