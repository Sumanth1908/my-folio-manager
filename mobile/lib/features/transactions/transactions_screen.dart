import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/utils/money_format.dart';
import '../../core/api/api_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/models/models.dart';
import '../accounts/accounts_provider.dart';
import '../accounts/transaction_form.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Providers
// ─────────────────────────────────────────────────────────────────────────────

final transactionPageProvider = StateProvider<int>((ref) => 0);

final transactionsProvider = FutureProvider.family<Map<String, dynamic>, int>(
  (ref, page) async {
    const limit = 30;
    final skip = page * limit;
    final response = await ApiClient.instance.dio.get(
      ApiEndpoints.transactions,
      queryParameters: {'skip': skip, 'limit': limit},
    );
    final data = response.data as Map<String, dynamic>;
    final items = (data['items'] as List<dynamic>)
        .map((e) => Transaction.fromJson(e as Map<String, dynamic>))
        .toList();
    return {'items': items, 'total': data['total'] as int};
  },
);

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

class TransactionsScreen extends ConsumerWidget {
  const TransactionsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final page = ref.watch(transactionPageProvider);
    final txAsync = ref.watch(transactionsProvider(page));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transactions', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh_outlined),
            onPressed: () => ref.invalidate(transactionsProvider)),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(transactionsProvider),
        child: txAsync.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48),
              const SizedBox(height: 8),
              Text(e.toString()),
              TextButton(onPressed: () => ref.invalidate(transactionsProvider), child: const Text('Retry')),
            ],
          )),
          data: (data) {
            final items = data['items'] as List<Transaction>;
            final total = data['total'] as int;
            const limit = 30;
            final totalPages = (total / limit).ceil();

            if (items.isEmpty) {
              return const Center(child: Text('No transactions found'));
            }

            return Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: items.length,
                    itemBuilder: (_, i) => _TransactionTile(tx: items[i]),
                  ),
                ),
                // Pagination
                if (totalPages > 1)
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.chevron_left),
                          onPressed: page == 0 ? null : () =>
                            ref.read(transactionPageProvider.notifier).state = page - 1,
                        ),
                        Text('Page ${page + 1} of $totalPages',
                          style: const TextStyle(fontWeight: FontWeight.w500)),
                        IconButton(
                          icon: const Icon(Icons.chevron_right),
                          onPressed: page >= totalPages - 1 ? null : () =>
                            ref.read(transactionPageProvider.notifier).state = page + 1,
                        ),
                      ],
                    ),
                  ),
              ],
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            builder: (ctx) => const TransactionForm(),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _TransactionTile extends ConsumerWidget {
  final Transaction tx;
  const _TransactionTile({required this.tx});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accountsList = ref.watch(accountsListProvider);
    final accountName = accountsList.maybeWhen(
      data: (accounts) {
        final acc = accounts.where((a) => a.accountId == tx.accountId).firstOrNull;
        if (acc == null) return '';
        return acc.accountName ?? acc.accountType.name.toUpperCase();
      },
      orElse: () => '',
    );
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isCredit = tx.transactionType == TransactionType.credit;
    final fmt = MoneyFormat(symbol: '${tx.currency} ', currency: tx.currency);
    final dateFmt = DateFormat('MMM d, y');
    
    final greenColor = isDark ? Colors.greenAccent : Colors.green[800]!;

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            builder: (context) => TransactionForm(
              accountId: tx.accountId,
              transactionToEdit: tx,
            ),
          );
        },
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        leading: CircleAvatar(
          backgroundColor: (isCredit ? greenColor : cs.error).withValues(alpha: 0.15),
          child: Icon(
            isCredit ? Icons.arrow_downward : Icons.arrow_upward,
            color: isCredit ? greenColor : cs.error,
            size: 18,
          ),
        ),
        title: Text(tx.description ?? 'Transaction',
          style: const TextStyle(fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 6),
          child: Wrap(
            spacing: 6,
            runSpacing: 6,
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHigh.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  tx.category?.name ?? 'Uncategorized',
                  style: TextStyle(color: cs.onSurfaceVariant, fontSize: 10, fontWeight: FontWeight.w600),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: cs.surfaceContainerHigh.withValues(alpha: 0.5),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  dateFmt.format(DateTime.parse(tx.transactionDate)),
                  style: TextStyle(color: cs.onSurfaceVariant, fontSize: 10, fontWeight: FontWeight.w600),
                ),
              ),
              if (accountName.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: cs.secondaryContainer.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: cs.secondaryContainer),
                  ),
                  child: Text(
                    accountName,
                    style: TextStyle(color: cs.onSecondaryContainer, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
            ],
          ),
        ),
        trailing: Text(
          '${isCredit ? '+' : '-'}${fmt.format(tx.amount)}',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: isCredit ? greenColor : cs.error,
          ),
        ),
      ),
    );
  }
}
