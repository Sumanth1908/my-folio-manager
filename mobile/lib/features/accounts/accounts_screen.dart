import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/utils/money_format.dart';

import '../../core/models/models.dart';
import '../../core/router/app_router.dart';
import '../dashboard/dashboard_provider.dart';
import 'accounts_provider.dart';
import 'account_form.dart';

class AccountsScreen extends ConsumerWidget {
  const AccountsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summaryAsync = ref.watch(dashboardSummaryProvider);
    final range = ref.watch(dashboardTimeRangeNotifierProvider);
    final accountsAsync = ref.watch(accountsListProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Accounts',
            style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined),
            onPressed: () {
              ref.invalidate(accountsListProvider);
              ref.invalidate(dashboardSummaryProvider);
            },
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            builder: (ctx) => const AccountForm(),
          );
        },
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(accountsListProvider);
          ref.invalidate(dashboardSummaryProvider);
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Manage your portfolio',
                            style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: cs.onSurfaceVariant)),
                      ],
                    ),
                  ),
                  Row(
                    children: [
                      _RangeButton(
                        label: '30D',
                        isSelected: range == DashboardTimeRange.thisMonth,
                        onPressed: () => ref
                            .read(dashboardTimeRangeNotifierProvider.notifier)
                            .setRange(DashboardTimeRange.thisMonth),
                      ),
                      _RangeButton(
                        label: 'LAST MONTH',
                        isSelected: range == DashboardTimeRange.lastMonth,
                        onPressed: () => ref
                            .read(dashboardTimeRangeNotifierProvider.notifier)
                            .setRange(DashboardTimeRange.lastMonth),
                      ),
                      _RangeButton(
                        label: 'ALL TIME',
                        isSelected: range == DashboardTimeRange.allTime,
                        onPressed: () => ref
                            .read(dashboardTimeRangeNotifierProvider.notifier)
                            .setRange(DashboardTimeRange.allTime),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 24),
              summaryAsync.when(
                loading: () => const Center(
                    child: Padding(
                        padding: EdgeInsets.all(40),
                        child: CircularProgressIndicator())),
                error: (e, _) =>
                    Center(child: Text('Error loading summary: $e')),
                data: (summary) {
                  if (summary.accounts.isEmpty) {
                    return Center(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 60),
                        child: Column(
                          children: [
                            Icon(Icons.account_balance_wallet_outlined,
                                size: 60, color: cs.outline),
                            const SizedBox(height: 16),
                            Text('No accounts found for this period',
                                style: TextStyle(color: cs.onSurfaceVariant)),
                          ],
                        ),
                      ),
                    );
                  }

                  return Column(
                    children: summary.accounts.map((accSummary) {
                      final fullAcc = accountsAsync.valueOrNull
                          ?.where((a) => a.accountId == accSummary.accountId)
                          .firstOrNull;
                      return _AccountExpandableCard(
                          accountSummary: accSummary, fullAccount: fullAcc);
                    }).toList(),
                  );
                },
              ),
              const SizedBox(height: 60),
            ],
          ),
        ),
      ),
    );
  }
}

class _AccountExpandableCard extends ConsumerWidget {
  final AccountSummary accountSummary;
  final Account? fullAccount;

  const _AccountExpandableCard(
      {required this.accountSummary, this.fullAccount});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final inTotal = accountSummary.categories
        .where((c) => c.transactionType == TransactionType.credit)
        .fold(0.0, (sum, c) => sum + c.totalAmount);
    final outTotal = accountSummary.categories
        .where((c) => c.transactionType == TransactionType.debit)
        .fold(0.0, (sum, c) => sum + c.totalAmount);

    final compact =
        MoneyFormat(currency: accountSummary.currency).consolidated;
    final fmtInflow = compact.format(inTotal);
    final fmtOutflow = compact.format(outTotal);

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          childrenPadding:
              const EdgeInsets.only(bottom: 12, left: 16, right: 16),
          controlAffinity: ListTileControlAffinity.leading,
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                      child: Text(
                    accountSummary.accountName ??
                        accountSummary.accountType.name.toUpperCase(),
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 16),
                    overflow: TextOverflow.ellipsis,
                  )),
                  const SizedBox(width: 8),
                  Container(
                      height: 16,
                      width: 1,
                      color: cs.outlineVariant.withValues(alpha: 0.5)),
                  const SizedBox(width: 8),
                  IconButton(
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    icon: Icon(Icons.visibility_outlined,
                        size: 20, color: cs.onSurfaceVariant),
                    onPressed: () {
                      context.goNamed(AppRoute.accountDetail,
                          pathParameters: {'id': accountSummary.accountId});
                    },
                  ),
                ],
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  Text(accountSummary.accountType.name.toUpperCase(),
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: cs.onSurfaceVariant)),
                  Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 4),
                      child: Icon(Icons.circle,
                          size: 4, color: cs.onSurfaceVariant)),
                  Text(accountSummary.currency,
                      style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: cs.onSurfaceVariant)),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('INFLOW',
                            style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: cs.onSurfaceVariant,
                                letterSpacing: 1)),
                        const SizedBox(height: 2),
                        Text('+$fmtInflow',
                            style: const TextStyle(
                                color: Colors.green,
                                fontWeight: FontWeight.w900,
                                fontSize: 13,
                                fontFeatures: [
                                  ui.FontFeature.tabularFigures()
                                ])),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('OUTFLOW',
                            style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.bold,
                                color: cs.onSurfaceVariant,
                                letterSpacing: 1)),
                        const SizedBox(height: 2),
                        Text('-$fmtOutflow',
                            style: const TextStyle(
                                color: Colors.red,
                                fontWeight: FontWeight.w900,
                                fontSize: 13,
                                fontFeatures: [
                                  ui.FontFeature.tabularFigures()
                                ])),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
          children: [
            Container(
              decoration: BoxDecoration(
                color: cs.surfaceContainerHighest.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(12),
                border:
                    Border.all(color: cs.outlineVariant.withValues(alpha: 0.5)),
              ),
              child: Column(
                children: [
                  Padding(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      children: [
                        const SizedBox(width: 24),
                        const Expanded(
                            flex: 3,
                            child: Text('CATEGORY',
                                style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.grey,
                                    letterSpacing: 1))),
                        Expanded(
                            flex: 2,
                            child: Text('AMOUNT (${accountSummary.currency})',
                                textAlign: TextAlign.right,
                                style: const TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.grey,
                                    letterSpacing: 1))),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  if (accountSummary.categories.isEmpty)
                    const Padding(
                        padding: EdgeInsets.all(24),
                        child: Center(
                            child: Text('No transactions found',
                                style: TextStyle(
                                    color: Colors.grey, fontSize: 12)))),
                  ..._sortedCategories(accountSummary.categories).map((cat) {
                    final fmt = MoneyFormat(currency: accountSummary.currency)
                        .format(cat.totalAmount);
                    final isCredit =
                        cat.transactionType == TransactionType.credit;
                    return Padding(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                      child: Row(
                        children: [
                          Icon(
                              isCredit
                                  ? Icons.trending_up
                                  : Icons.trending_down,
                              size: 16,
                              color: isCredit ? Colors.green : Colors.red),
                          const SizedBox(width: 8),
                          Expanded(
                              flex: 3,
                              child: Text(cat.name,
                                  style: const TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600))),
                          Expanded(
                            flex: 2,
                            child: Text(
                              '${isCredit ? '+' : ''}$fmt',
                              textAlign: TextAlign.right,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                color: isCredit ? Colors.green : cs.onSurface,
                                fontFeatures: const [
                                  ui.FontFeature.tabularFigures()
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }



  List<CategorySummary> _sortedCategories(List<CategorySummary> cats) {
    final sorted = List<CategorySummary>.from(cats);
    sorted.sort((a, b) => b.totalAmount.compareTo(a.totalAmount));
    return sorted;
  }
}
class _RangeButton extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onPressed;

  const _RangeButton({
    required this.label,
    required this.isSelected,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(left: 8),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(14),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? cs.primary : cs.surfaceContainerLow,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
                color: isSelected ? cs.primary : cs.outlineVariant, width: 1.2),
          ),
          child: Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w800,
              color: isSelected ? Colors.white : cs.onSurface,
            ),
          ),
        ),
      ),
    );
  }
}
