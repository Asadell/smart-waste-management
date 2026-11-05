import 'package:swm_mobile/core/core.dart';

import 'dashboard_stats.dart';

class DashboardRepository {
  DashboardRepository(this._api);

  final ApiClient _api;

  Future<DashboardStats> stats() async {
    final res = await _api.get<Map<String, dynamic>>('/dashboard/stats', query: {'days': 7});
    return DashboardStats.fromJson(res['data'] as Map<String, dynamic>);
  }
}
