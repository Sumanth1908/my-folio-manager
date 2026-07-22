import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../core/utils/money_format.dart';
import '../../core/models/models.dart';
import 'accounts_provider.dart';
import 'transactions_provider.dart';
import 'rules_provider.dart';
import 'transaction_form.dart';
import 'rule_form.dart';
import 'account_form.dart';
import 'holding_form.dart';
import '../shared/providers/categories_provider.dart';

class AccountDetailScreen extends ConsumerWidget {
  final String accountId;
  const AccountDetailScreen({super.key, required this.accountId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accountAsync = ref.watch(accountDetailProvider(accountId));

    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 500),
      child: accountAsync.when(
        loading: () => const Scaffold(key: ValueKey('loading'), body: Center(child: CircularProgressIndicator())),
        error: (e, _) => Scaffold(
          key: const ValueKey('error'),
          appBar: AppBar(),
          body: Center(child: Text('Error: $e')),
        ),
        data: (account) => _AccountDetailView(key: const ValueKey('data'), account: account),
      ),
    );
  }
}

class _AccountDetailView extends ConsumerStatefulWidget {
  final Account account;
  const _AccountDetailView({super.key, required this.account});

  @override
  ConsumerState<_AccountDetailView> createState() => _AccountDetailViewState();
}

class _AccountDetailViewState extends ConsumerState<_AccountDetailView> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  // removed unused _searchQuery field

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.account.accountName ?? 'Account Details',
          style: const TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh_outlined),
            onPressed: () {
              ref.invalidate(accountDetailProvider(widget.account.accountId));
              ref.invalidate(accountTransactionsProvider(widget.account.accountId));
              ref.invalidate(accountRulesProvider(widget.account.accountId));
            }),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 1.1),
          tabs: const [
            Tab(text: 'OVERVIEW'),
            Tab(text: 'ACTIVITY'),
            Tab(text: 'RULES'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _OverviewTab(account: widget.account),
          _ActivityTab(
            accountId: widget.account.accountId,
            currency: widget.account.currency,
          ),
          _RulesTab(
            accountId: widget.account.accountId,
            currency: widget.account.currency,
          ),
        ],
      ),
      floatingActionButton: ListenableBuilder(
        listenable: _tabController,
        builder: (context, _) {
          if (_tabController.index == 0) return const SizedBox.shrink();
          return FloatingActionButton.extended(
            onPressed: () {
              showModalBottomSheet(
                context: context,
                isScrollControlled: true,
                builder: (context) => _tabController.index == 1
                    ? TransactionForm(accountId: widget.account.accountId)
                    : RuleForm(accountId: widget.account.accountId),
              );
            },
            icon: Icon(_tabController.index == 1 ? Icons.add : Icons.auto_awesome),
            label: Text(_tabController.index == 1 ? 'New Transaction' : 'New Rule'),
          );
        },
      ),
    );
  }
}

class _OverviewTab extends ConsumerWidget {
  final Account account;
  const _OverviewTab({required this.account});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildHeroBalance(context),
        const SizedBox(height: 24),
        Text('Account Specifications',
            style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: cs.primary,
                letterSpacing: 1.2)),
        const SizedBox(height: 12),
        _buildTypeSpecificDetails(context),
        if (account.accountType == AccountType.investment) ...[
          const SizedBox(height: 32),
          Row(
            children: [
              Text('Asset Holdings',
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: cs.primary,
                      letterSpacing: 1.2)),
              const Spacer(),
              IconButton(
                visualDensity: VisualDensity.compact,
                icon: const Icon(Icons.refresh, size: 16),
                onPressed: () async {
                  await ref.read(holdingsNotifierProvider(account.accountId).notifier).refreshPrices();
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Prices updated'), behavior: SnackBarBehavior.floating));
                  }
                },
              ),
              const SizedBox(width: 8),
              FilledButton.tonalIcon(
                onPressed: () {
                   showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    builder: (context) => HoldingForm(accountId: account.accountId, currency: account.currency),
                  );
                },
                icon: const Icon(Icons.add, size: 14),
                label: const Text('Add Position', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
                  visualDensity: VisualDensity.compact,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _HoldingsList(holdings: account.investmentHoldings),
        ],
        const SizedBox(height: 40),
        Text('Manage Account',
            style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: cs.primary,
                letterSpacing: 1.2)),
        const SizedBox(height: 12),
        Card(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
            side: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.5)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(
                  child: TextButton.icon(
                    onPressed: () {
                      showModalBottomSheet(
                        context: context,
                        isScrollControlled: true,
                        builder: (ctx) => AccountForm(accountToEdit: account),
                      );
                    },
                    icon: const Icon(Icons.edit_outlined),
                    label: const Text('Edit Details'),
                  ),
                ),
                Container(width: 1, height: 24, color: cs.outlineVariant),
                Expanded(
                  child: TextButton.icon(
                    onPressed: () async {
                      final confirmed = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text('Delete Account?'),
                          content: const Text('This will permanently delete this account. This action cannot be undone.'),
                          actions: [
                            TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                            TextButton(
                              onPressed: () => Navigator.pop(ctx, true),
                              style: TextButton.styleFrom(foregroundColor: Colors.red),
                              child: const Text('Delete'),
                            ),
                          ],
                        ),
                      );
                      if (confirmed == true) {
                         await ref.read(accountDetailProvider(account.accountId).notifier).deleteAccount(account.accountId);
                         if (context.mounted) {
                           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Account deleted successfully')));
                           // Since we are in detail view, we should go back
                           Navigator.pop(context); 
                         }
                      }
                    },
                    icon: const Icon(Icons.delete_outline, color: Colors.red),
                    label: const Text('Delete', style: TextStyle(color: Colors.red)),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 48),
      ],
    );
  }

  Widget _buildHeroBalance(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final fmt = MoneyFormat(symbol: '${account.currency} ', currency: account.currency);
    double? primaryValue;
    String label = 'Current Balance';

    if (account.accountType == AccountType.savings &&
        account.savingsAccount != null) {
      primaryValue = account.savingsAccount!.balance;
    } else if (account.accountType == AccountType.loan &&
        account.loanAccount != null) {
      primaryValue = account.loanAccount!.outstandingAmount;
      label = 'Outstanding Balance';
    } else if (account.accountType == AccountType.fixedDeposit &&
        account.fixedDepositAccount != null) {
      primaryValue = account.fixedDepositAccount!.balance;
      label = 'Current Balance';
    } else if (account.accountType == AccountType.investment) {
      primaryValue = account.investmentHoldings.fold<double>(
          0.0,
          (sum, h) =>
              sum + (h.quantity * (h.currentPrice ?? h.averagePrice)));
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [cs.primary, cs.primary.withValues(alpha: 0.8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: cs.primary.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(
                  color: cs.onPrimary.withValues(alpha: 0.7),
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 0.5)),
          const SizedBox(height: 8),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                primaryValue != null ? fmt.format(primaryValue) : '--',
                style: TextStyle(
                    color: cs.onPrimary,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.5),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTypeSpecificDetails(BuildContext context) {
    switch (account.accountType) {
      case AccountType.savings:
        return _SavingsDetail(account: account.savingsAccount!, currency: account.currency);
      case AccountType.loan:
        return _LoanDetail(loan: account.loanAccount!, currency: account.currency);
      case AccountType.fixedDeposit:
        return _FDDetail(fd: account.fixedDepositAccount!, currency: account.currency);
      case AccountType.investment:
        return _DetailsCard(rows: [
          _DetailRow(
              icon: Icons.category_outlined,
              label: 'Account Type',
              value: 'INVESTMENT'),
          _DetailRow(
              icon: Icons.currency_exchange_outlined,
              label: 'Currency',
              value: account.currency),
        ]);
    }
  }
}

class _ActivityTab extends ConsumerStatefulWidget {
  final String accountId;
  final String currency;
  const _ActivityTab({required this.accountId, required this.currency});

  @override
  ConsumerState<_ActivityTab> createState() => _ActivityTabState();
}

class _ActivityTabState extends ConsumerState<_ActivityTab> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String? _selectedCategory;

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final transactionsAsync = ref.watch(accountTransactionsProvider(widget.accountId));

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search transactions...',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _searchQuery.isNotEmpty 
                    ? IconButton(icon: const Icon(Icons.clear), onPressed: () {
                        _searchController.clear();
                        setState(() => _searchQuery = '');
                      })
                    : null,
                  contentPadding: const EdgeInsets.symmetric(vertical: 0),
                ),
                onChanged: (val) => setState(() => _searchQuery = val),
              ),
              const SizedBox(height: 12),
              Consumer(builder: (context, ref, _) {
                final categoriesAsync = ref.watch(categoriesListProvider);
                return categoriesAsync.when(
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                  data: (categories) {
                    return SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          ChoiceChip(
                            label: const Text('All'),
                            selected: _selectedCategory == null,
                            onSelected: (val) => setState(() => _selectedCategory = null),
                          ),
                          const SizedBox(width: 8),
                          ...categories.map((c) => Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(c.name),
                              selected: _selectedCategory == c.name,
                              onSelected: (val) => setState(() => _selectedCategory = val ? c.name : null),
                            ),
                          )),
                        ],
                      ),
                    );
                  },
                );
              }),
            ],
          ),
        ),
        Expanded(
          child: transactionsAsync.when(
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (e, _) => Center(child: Text('Error: $e')),
            data: (transactions) {
              final filtered = transactions.where((tx) {
                final query = _searchQuery.toLowerCase();
                final matchesSearch = (tx.description?.toLowerCase().contains(query) ?? false) ||
                       (tx.category?.name.toLowerCase().contains(query) ?? false) ||
                       tx.amount.toString().contains(query);
                final matchesCategory = _selectedCategory == null || tx.category?.name == _selectedCategory;
                return matchesSearch && matchesCategory;
              }).toList();

              if (filtered.isEmpty) {
                return Center(child: Text(_searchQuery.isEmpty ? 'No transactions yet' : 'No matches found',
                  style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)));
              }

              return ListView.builder(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                itemCount: filtered.length,
                itemBuilder: (context, index) {
                  final tx = filtered[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _TransactionItem(transaction: tx, currency: widget.currency),
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}

class _TransactionItem extends ConsumerWidget {
  final Transaction transaction;
  final String currency;
  const _TransactionItem({required this.transaction, required this.currency});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final isCredit = transaction.transactionType == TransactionType.credit;
    final fmt = MoneyFormat(symbol: '$currency ', currency: currency);

    return Card(
      child: InkWell(
        onTap: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            builder: (context) => TransactionForm(accountId: transaction.accountId, transactionToEdit: transaction),
          );
        },
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: (isCredit ? Colors.green : cs.error).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(
                  isCredit ? Icons.add_rounded : Icons.remove_rounded,
                  color: isCredit ? (Theme.of(context).brightness == Brightness.dark ? Colors.greenAccent : Colors.green[700]) : cs.error,
                  size: 20,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(transaction.description ?? 'No Description',
                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 2),
                    Text(
                      '${DateFormat('dd-MMM-yyyy').format(DateTime.parse(transaction.transactionDate))} ${transaction.category != null ? '• ${transaction.category!.name}' : ''}',
                      style: TextStyle(color: cs.onSurfaceVariant, fontSize: 11, fontWeight: FontWeight.w500),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${isCredit ? '+' : '-'}${fmt.format(transaction.amount).replaceAll(currency, '').trim()}',
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      color: isCredit ? (Theme.of(context).brightness == Brightness.dark ? Colors.greenAccent : Colors.green[800]) : cs.onSurface,
                      fontSize: 16,
                      fontFeatures: const [ui.FontFeature.tabularFigures()],
                    ),
                  ),
                  Text(currency, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 9, fontWeight: FontWeight.w800)),
                ],
              ),
              const SizedBox(width: 4),
              PopupMenuButton<String>(
                icon: Icon(Icons.more_vert_rounded, size: 20, color: cs.onSurfaceVariant),
                padding: EdgeInsets.zero,
                onSelected: (val) {
                  if (val == 'edit') {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      builder: (context) => TransactionForm(accountId: transaction.accountId, transactionToEdit: transaction),
                    );
                  } else if (val == 'delete') {
                    ref.read(accountTransactionsProvider(transaction.accountId).notifier).deleteTransaction(transaction.transactionId);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Transaction deleted'), behavior: SnackBarBehavior.floating),
                      );
                    }
                  }
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_outlined, size: 18), SizedBox(width: 8), Text('Edit')])),
                  const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline, size: 18, color: Colors.red), SizedBox(width: 8), Text('Delete', style: TextStyle(color: Colors.red))])),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RulesTab extends ConsumerWidget {
  final String accountId;
  final String currency;
  const _RulesTab({required this.accountId, required this.currency});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rulesAsync = ref.watch(accountRulesProvider(accountId));

    return rulesAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (rules) {
        if (rules.isEmpty) {
          return Center(child: Text('No rules defined for this account',
            style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)));
        }

        return RefreshIndicator(
          onRefresh: () async => ref.invalidate(accountRulesProvider(accountId)),
          child: ListView.builder(
            padding: const EdgeInsets.only(bottom: 80, top: 16),
            itemCount: rules.length,
            itemBuilder: (context, index) {
              final rule = rules[index];
              return _RuleItem(rule: rule, currency: currency, accountId: accountId);
            },
          ),
        );
      },
    );
  }
}

class _RuleItem extends ConsumerWidget {
  final Rule rule;
  final String currency;
  final String accountId;
  const _RuleItem({required this.rule, required this.currency, required this.accountId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: cs.outlineVariant),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(rule.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                      const SizedBox(height: 2),
                      Text(rule.ruleType.name.toUpperCase(), 
                        style: TextStyle(color: cs.primary, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                    ],
                  ),
                ),
                Switch(
                  value: rule.isActive,
                  onChanged: (val) async {
                    await ref.read(accountRulesProvider(accountId).notifier).toggleRule(rule.ruleId, val);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Rule ${val ? 'enabled' : 'disabled'}'),
                          behavior: SnackBarBehavior.floating,
                          duration: const Duration(seconds: 1),
                        ),
                      );
                    }
                  },
                ),
              ],
            ),
            const Divider(height: 24),
            if (rule.ruleType == RuleType.categorization) ...[
              if (rule.descriptionContains != null)
                _RuleInfoRow(label: 'Contains', value: '"${rule.descriptionContains}"'),
              if (rule.categoryName != null)
                _RuleInfoRow(label: 'Category', value: rule.categoryName!),
            ] else ...[
              _RuleInfoRow(label: 'Frequency', value: rule.frequency?.name.toUpperCase() ?? 'MONTHLY'),
              _RuleInfoRow(label: 'Type', value: rule.transactionType?.name.toUpperCase() ?? 'DEBIT'),
              if (rule.ruleType == RuleType.calculation)
                _RuleInfoRow(label: 'Formula', value: rule.formula ?? '')
              else if (rule.transactionAmount != null)
                _RuleInfoRow(label: 'Amount', value: '$currency ${rule.transactionAmount}'),
              if (rule.nextRunAt != null)
                _RuleInfoRow(label: 'Next Run', value: DateFormat('dd-MMM-yyyy').format(DateTime.parse(rule.nextRunAt!))),
              if (rule.endDate != null)
                _RuleInfoRow(label: 'Ends', value: DateFormat('dd-MMM-yyyy').format(DateTime.parse(rule.endDate!))),
            ],
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: !rule.isActive ? null : () async {
                    await ref.read(accountRulesProvider(accountId).notifier).executeRule(rule.ruleId);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Rule executed successfully'), behavior: SnackBarBehavior.floating),
                      );
                    }
                  },
                  icon: const Icon(Icons.play_arrow, size: 18),
                  label: const Text('Run Now'),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.edit_outlined, size: 20),
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      isScrollControlled: true,
                      builder: (context) => RuleForm(accountId: accountId, ruleToEdit: rule),
                    );
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline, size: 20),
                  onPressed: () async {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Delete Rule'),
                        content: const Text('Are you sure you want to delete this rule?'),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
                        ],
                      ),
                    );
                    if (confirm == true) {
                      await ref.read(accountRulesProvider(accountId).notifier).deleteRule(rule.ruleId);
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Rule deleted'), behavior: SnackBarBehavior.floating),
                        );
                      }
                    }
                  },
                  color: cs.error,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _RuleInfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _RuleInfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: RichText(
        text: TextSpan(
          style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontSize: 13),
          children: [
            TextSpan(text: '$label: ', style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant)),
            TextSpan(text: value, style: const TextStyle(fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }
}

class _SavingsDetail extends StatelessWidget {
  final SavingsAccount account;
  final String currency;
  const _SavingsDetail({required this.account, required this.currency});

  @override
  Widget build(BuildContext context) {
    final fmt = MoneyFormat(symbol: '$currency ', currency: currency);
    return _DetailsCard(rows: [
      _DetailRow(
          icon: Icons.category_outlined,
          label: 'Account Type',
          value: 'SAVINGS'),
      _DetailRow(
          icon: Icons.currency_exchange_outlined,
          label: 'Currency',
          value: currency),
      _DetailRow(
          icon: Icons.account_balance_wallet_outlined,
          label: 'Total Balance',
          value: fmt.format(account.balance)),
      if (account.interestRate != null)
        _DetailRow(
            icon: Icons.percent_outlined,
            label: 'Interest Rate',
            value: '${account.interestRate}% p.a.'),
      if (account.minBalance != null)
        _DetailRow(
            icon: Icons.vertical_align_bottom_outlined,
            label: 'Minimum Balance',
            value: fmt.format(account.minBalance!)),
    ]);
  }
}

class _LoanDetail extends StatelessWidget {
  final LoanAccount loan;
  final String currency;
  const _LoanDetail({required this.loan, required this.currency});

  @override
  Widget build(BuildContext context) {
    final fmt = MoneyFormat(symbol: '$currency ', currency: currency);
    return _DetailsCard(rows: [
      _DetailRow(
          icon: Icons.category_outlined,
          label: 'Account Type',
          value: 'LOAN'),
      _DetailRow(
          icon: Icons.currency_exchange_outlined,
          label: 'Currency',
          value: currency),
      _DetailRow(
          icon: Icons.pending_actions_outlined,
          label: 'Outstanding',
          value: fmt.format(loan.outstandingAmount)),
      _DetailRow(
          icon: Icons.payments_outlined,
          label: 'Total Loan',
          value: fmt.format(loan.loanAmount)),
      _DetailRow(
          icon: Icons.percent_outlined,
          label: 'Interest Rate',
          value: '${loan.interestRate}% p.a.'),
      _DetailRow(
          icon: Icons.event_repeat_outlined,
          label: 'Monthly EMI',
          value: fmt.format(loan.emiAmount)),
      _DetailRow(
          icon: Icons.timer_outlined,
          label: 'Tenure',
          value: '${loan.tenureMonths} months'),
      _DetailRow(
          icon: Icons.calendar_today_outlined,
          label: 'Start Date',
          value: DateFormat('dd-MMM-yyyy').format(DateTime.parse(loan.startDate))),
    ]);
  }
}

class _FDDetail extends StatelessWidget {
  final FixedDepositAccount fd;
  final String currency;
  const _FDDetail({required this.fd, required this.currency});

  @override
  Widget build(BuildContext context) {
    final fmt = MoneyFormat(symbol: '$currency ', currency: currency);
    return _DetailsCard(rows: [
      _DetailRow(
          icon: Icons.category_outlined,
          label: 'Account Type',
          value: 'FIXED DEPOSIT'),
      _DetailRow(
          icon: Icons.currency_exchange_outlined,
          label: 'Currency',
          value: currency),
      _DetailRow(
          icon: Icons.verified_outlined,
          label: 'Principal',
          value: fmt.format(fd.principalAmount)),
      _DetailRow(
          icon: Icons.account_balance_wallet_outlined,
          label: 'Current Balance',
          value: fmt.format(fd.balance)),
      _DetailRow(
          icon: Icons.auto_graph_outlined,
          label: 'Maturity Amount',
          value: fmt.format(fd.maturityAmount)),
      _DetailRow(
          icon: Icons.percent_outlined,
          label: 'Interest Rate',
          value: '${fd.interestRate}% p.a.'),
      _DetailRow(
          icon: Icons.event_available_outlined,
          label: 'Maturity Date',
          value: fd.maturityDate.substring(0, 10)),
    ]);
  }
}

class _HoldingsList extends StatelessWidget {
  final List<InvestmentHolding> holdings;
  const _HoldingsList({required this.holdings});

  @override
  Widget build(BuildContext context) {
    if (holdings.isEmpty) {
      return const Center(child: Text('No holdings'));
    }
    return Column(
      children: holdings.map((h) => _HoldingCard(holding: h)).toList(),
    );
  }
}

class _HoldingCard extends ConsumerWidget {
  final InvestmentHolding holding;
  const _HoldingCard({required this.holding});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cs = Theme.of(context).colorScheme;
    final currentPrice = holding.currentPrice ?? holding.averagePrice;
    final pnl = (currentPrice - holding.averagePrice) * holding.quantity;
    final pnlPct = holding.averagePrice > 0
        ? ((currentPrice - holding.averagePrice) /
            holding.averagePrice *
            100)
        : 0.0;
    final isGain = pnl >= 0;
    final fmt =
        MoneyFormat(symbol: '${holding.currency} ', currency: holding.currency);

    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: InkWell(
        onTap: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            builder: (context) => HoldingForm(
              accountId: holding.accountId,
              currency: holding.currency,
              holdingToEdit: holding,
              initialAction: HoldingAction.buy,
            ),
          );
        },
        borderRadius: BorderRadius.circular(20),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: cs.primaryContainer.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(
                        holding.symbol.length > 3
                            ? holding.symbol.substring(0, 3)
                            : holding.symbol,
                        style: TextStyle(
                            color: cs.primary,
                            fontWeight: FontWeight.w900,
                            fontSize: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(holding.symbol,
                            style: const TextStyle(
                                fontWeight: FontWeight.bold, fontSize: 16)),
                        Text(holding.name,
                            style: TextStyle(
                                color: cs.onSurfaceVariant, fontSize: 12),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  PopupMenuButton<String>(
                    icon: Icon(Icons.more_horiz, color: cs.onSurfaceVariant, size: 20),
                    padding: EdgeInsets.zero,
                    onSelected: (val) {
                      if (val == 'edit') {
                        showModalBottomSheet(
                          context: context,
                          isScrollControlled: true,
                          builder: (context) => HoldingForm(
                            accountId: holding.accountId,
                            currency: holding.currency,
                            holdingToEdit: holding,
                            initialAction: HoldingAction.edit,
                          ),
                        );
                      } else if (val == 'delete') {
                        _confirmDelete(context, ref);
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(value: 'edit', child: Row(children: [Icon(Icons.edit_outlined, size: 18), SizedBox(width: 8), Text('Edit Details')])),
                      const PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete_outline, size: 18, color: Colors.red), SizedBox(width: 8), Text('Remove Position', style: TextStyle(color: Colors.red))])),
                    ],
                  ),
                ],
              ),
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 12),
                child: Divider(height: 1),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        fmt.format(currentPrice * holding.quantity),
                        style: const TextStyle(
                            fontWeight: FontWeight.w900, fontSize: 17, letterSpacing: -0.5),
                      ),
                      Row(
                        children: [
                          Icon(
                              isGain
                                  ? Icons.trending_up
                                  : Icons.trending_down,
                              size: 14,
                              color: isGain ? Colors.green : cs.error),
                          const SizedBox(width: 4),
                          Text(
                            '${isGain ? '+' : ''}${pnlPct.toStringAsFixed(2)}%',
                            style: TextStyle(
                                color: isGain ? Colors.green : cs.error,
                                fontWeight: FontWeight.bold,
                                fontSize: 11),
                          ),
                        ],
                      ),
                    ],
                  ),
                  _HoldingDetail(label: 'Avg Price', value: fmt.format(holding.averagePrice)),
                  _HoldingDetail(
                      label: 'Qty',
                      value: formatQuantity(holding.quantity,
                          currency: holding.currency)),
                  _HoldingDetail(
                    label: 'P&L',
                    value: fmt.format(pnl),
                    color: isGain ? Colors.green : cs.error,
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove Position?'),
        content: Text('This will permanently delete the holding for ${holding.symbol} from this account.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(holdingsNotifierProvider(holding.accountId).notifier).deleteHolding(holding.holdingId);
    }
  }
}

class _HoldingDetail extends StatelessWidget {
  final String label;
  final String value;
  final Color? color;

  const _HoldingDetail({required this.label, required this.value, this.color});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(),
            style: TextStyle(
                fontSize: 9,
                color: cs.onSurfaceVariant,
                fontWeight: FontWeight.bold,
                letterSpacing: 0.5)),
        const SizedBox(height: 2),
        Text(value,
            style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: color ?? cs.onSurface)),
      ],
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared detail presentation widgets
// ─────────────────────────────────────────────────────────────────────────────

class _DetailsCard extends StatelessWidget {
  final List<Widget> rows;
  const _DetailsCard({required this.rows});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.5)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: List.generate(rows.length, (index) {
            return Column(
              children: [
                rows[index],
                if (index < rows.length - 1)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 8),
                    child: Divider(height: 1, indent: 44),
                  ),
              ],
            );
          }),
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: cs.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: cs.primary),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label,
                    style: TextStyle(
                        color: cs.onSurfaceVariant,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5)),
                Text(value,
                    style: const TextStyle(
                        fontWeight: FontWeight.w700, fontSize: 14)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
