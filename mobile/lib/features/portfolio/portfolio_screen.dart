import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/settings_provider.dart';
import '../../core/utils/money_format.dart';
import 'portfolio_provider.dart';

class PortfolioScreen extends ConsumerWidget {
  const PortfolioScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final balanceSheetAsync = ref.watch(balanceSheetProvider);
    final currencySymbol = ref.watch(currencySymbolProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Portfolio', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(icon: const Icon(Icons.refresh_outlined),
            onPressed: () => ref.invalidate(balanceSheetProvider)),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.refresh(balanceSheetProvider.future),
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 500),
          child: balanceSheetAsync.when(
            loading: () => const Center(key: ValueKey('loading'), child: CircularProgressIndicator()),
            error: (e, _) => Center(key: ValueKey('error'), child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 48),
                const SizedBox(height: 8),
                Text(e.toString()),
                TextButton(onPressed: () => ref.invalidate(balanceSheetProvider), child: const Text('Retry')),
              ],
            )),
            data: (sheet) => _PortfolioContent(key: const ValueKey('data'), sheet: sheet, currencySymbol: currencySymbol),
          ),
        ),
      ),
    );
  }
}

class _PortfolioContent extends StatelessWidget {
  final BalanceSheet sheet;
  final String currencySymbol;
  const _PortfolioContent({super.key, required this.sheet, required this.currencySymbol});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Net Worth Card
        _NetWorthCard(sheet: sheet, symbol: currencySymbol),
        
        const SizedBox(height: 24),
        
        // Distribution Bar
        _DistributionBar(sheet: sheet),
        
        const SizedBox(height: 24),
        
        // Assets section
        _SectionHeader(title: 'ASSETS', total: sheet.totalAssets, symbol: currencySymbol),
        const SizedBox(height: 12),
        ...sheet.assets.map((item) => _BalanceItemExpansionTile(item: item, symbol: currencySymbol)),
        
        const SizedBox(height: 24),
        
        // Liabilities section
        _SectionHeader(title: 'LIABILITIES', total: sheet.totalLiabilities, symbol: currencySymbol, color: Colors.redAccent),
        const SizedBox(height: 12),
        ...sheet.liabilities.map((item) => _BalanceItemExpansionTile(item: item, symbol: currencySymbol, isLiability: true)),
        
        const SizedBox(height: 32),
        
        // Active Holdings Analysis
        _HoldingsAnalysisTable(holdings: sheet.aggregatedHoldings, symbol: currencySymbol),
        
        const SizedBox(height: 48),
      ],
    );
  }
}

class _NetWorthCard extends StatelessWidget {
  final BalanceSheet sheet;
  final String symbol;
  const _NetWorthCard({required this.sheet, required this.symbol});

  @override
  Widget build(BuildContext context) {
    // Net worth runs at 32pt, so it is consolidated (`₹30L`) to stay on one
    // line; long-pressing the tooltip reveals the exact figure.
    final fmt = MoneyFormat(symbol: symbol);
    final short = fmt.consolidated;
    final isPositive = sheet.netWorth >= 0;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: isPositive
              ? [const Color(0xFF1A472A), const Color(0xFF2D6A4F)]
              : [const Color(0xFF4A1122), const Color(0xFF6A1F3A)],
          begin: Alignment.topLeft, end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: (isPositive ? Colors.green : Colors.red).withValues(alpha: 0.2), blurRadius: 15, offset: const Offset(0, 8)),
        ],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('TOTAL NET WORTH', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
        const SizedBox(height: 8),
        Tooltip(
          message: fmt.exact(sheet.netWorth),
          child: Text(short.format(sheet.netWorth),
            style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900, fontFeatures: [FontFeature.tabularFigures()])),
        ),
        const SizedBox(height: 20),
        Row(children: [
          _QuickStat(label: 'ASSETS', value: short.format(sheet.totalAssets)),
          const SizedBox(width: 32),
          _QuickStat(label: 'DEBTRATIO', value: '${sheet.totalAssets > 0 ? (sheet.totalLiabilities / sheet.totalAssets * 100).toStringAsFixed(1) : "0"}%', color: Colors.white60),
        ]),
      ]),
    );
  }
}

class _QuickStat extends StatelessWidget {
  final String label;
  final String value;
  final Color? color;
  const _QuickStat({required this.label, required this.value, this.color});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(color: Colors.white60, fontSize: 9, fontWeight: FontWeight.bold)),
      Text(value, style: TextStyle(color: color ?? Colors.white, fontSize: 14, fontWeight: FontWeight.bold, fontFeatures: const [FontFeature.tabularFigures()])),
    ]);
  }
}

class _DistributionBar extends StatelessWidget {
  final BalanceSheet sheet;
  const _DistributionBar({required this.sheet});

  @override
  Widget build(BuildContext context) {
    final total = sheet.totalAssets + sheet.totalLiabilities;
    if (total == 0) return const SizedBox.shrink();

    final colors = [const Color(0xFF8B5CF6), const Color(0xFF06B6D4), const Color(0xFF3B82F6), const Color(0xFFF43F5E)];

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('ALLOCATION OVERVIEW', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
      const SizedBox(height: 8),
      ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: SizedBox(
          height: 12,
          child: Row(children: [
            ...sheet.assets.asMap().entries.map((e) => Flexible(
              flex: (e.value.value / total * 100).round(),
              child: Container(color: colors[e.key % colors.length]),
            )),
            if (sheet.totalLiabilities > 0)
              Flexible(
                flex: (sheet.totalLiabilities / total * 100).round(),
                child: Container(color: colors.last),
              ),
          ]),
        ),
      ),
    ]);
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final double total;
  final String symbol;
  final Color? color;
  const _SectionHeader({required this.title, required this.total, required this.symbol, this.color});

  @override
  Widget build(BuildContext context) {
    final fmt = MoneyFormat(symbol: symbol).consolidated;
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(title, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: color ?? Colors.grey, letterSpacing: 1.5)),
      Text(fmt.format(total), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
    ]);
  }
}

class _BalanceItemExpansionTile extends StatelessWidget {
  final BalanceItem item;
  final String symbol;
  final bool isLiability;
  const _BalanceItemExpansionTile({required this.item, required this.symbol, this.isLiability = false});

  @override
  Widget build(BuildContext context) {
    final fmt = MoneyFormat(symbol: symbol, decimalDigits: 0).consolidated;
    return Card(
      elevation: 0,
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.withValues(alpha: 0.1))),
      child: ExpansionTile(
        title: Text(item.name, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
        trailing: Text(fmt.format(item.value), style: const TextStyle(fontWeight: FontWeight.bold)),
        children: item.accounts.map((acc) => _AccountDetailTile(account: acc, symbol: symbol)).toList(),
      ),
    );
  }
}

class _AccountDetailTile extends StatelessWidget {
  final SubAccount account;
  final String symbol;
  const _AccountDetailTile({required this.account, required this.symbol});

  @override
  Widget build(BuildContext context) {
    final fmt = MoneyFormat(symbol: symbol);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(border: Border(top: BorderSide(color: Colors.grey.withValues(alpha: 0.05)))),
      child: Column(children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text(account.name, style: const TextStyle(fontSize: 13, color: Colors.grey)),
          Text(fmt.format(account.value), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
        ]),
        if (account.holdings.isNotEmpty)
          ...account.holdings.map((h) => Padding(
            padding: const EdgeInsets.only(left: 12, top: 4),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('${h.symbol} (${h.name})', style: const TextStyle(fontSize: 11, color: Colors.blueGrey)),
              Text(fmt.format(h.value), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
            ]),
          )),
      ]),
    );
  }
}

class _HoldingsAnalysisTable extends StatelessWidget {
  final List<AggregatedHolding> holdings;
  final String symbol;
  const _HoldingsAnalysisTable({required this.holdings, required this.symbol});

  @override
  Widget build(BuildContext context) {
    // The column header already carries the symbol, so the rows are bare numbers
    // — `currency` is what picks the grouping.
    final fmt = MoneyFormat(currency: symbol);
    final cs = Theme.of(context).colorScheme;

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        const Text('ACTIVE HOLDINGS ANALYSIS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5)),
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(color: cs.surfaceContainer, borderRadius: BorderRadius.circular(4)),
          child: Text('${holdings.length} POSITIONS', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold)),
        ),
      ]),
      const SizedBox(height: 16),
      Container(
        decoration: BoxDecoration(
          color: cs.surfaceContainerLowest,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: cs.outlineVariant),
        ),
        child: Column(children: [
          _TableHeader(symbol: symbol),
          if (holdings.isEmpty)
            const Padding(
              padding: EdgeInsets.all(32),
              child: Text('No active holdings', style: TextStyle(color: Colors.grey, fontStyle: FontStyle.italic)),
            )
          else
            ...holdings.map((h) => _HoldingRow(holding: h, fmt: fmt)),
        ]),
      ),
    ]);
  }
}

class _TableHeader extends StatelessWidget {
  final String symbol;
  const _TableHeader({required this.symbol});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(children: [
        const Expanded(flex: 2, child: Text('SYMBOL', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey))),
        const Expanded(child: Text('QTY', textAlign: TextAlign.right, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey))),
        Expanded(flex: 2, child: Text('VALUE ($symbol)', textAlign: TextAlign.right, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey))),
        const Expanded(child: Text('P/L %', textAlign: TextAlign.right, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey))),
      ]),
    );
  }
}

class _HoldingRow extends StatelessWidget {
  final AggregatedHolding holding;
  final MoneyFormat fmt;
  const _HoldingRow({required this.holding, required this.fmt});

  @override
  Widget build(BuildContext context) {
    final isGain = holding.profit >= 0;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(border: Border(top: BorderSide(color: Colors.grey.withValues(alpha: 0.1)))),
      child: Row(children: [
        Expanded(flex: 2, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(holding.symbol, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
          Text(holding.name, style: const TextStyle(fontSize: 10, color: Colors.grey), overflow: TextOverflow.ellipsis),
        ])),
        Expanded(child: Text(holding.totalQuantity.toStringAsFixed(0), textAlign: TextAlign.right, style: const TextStyle(fontSize: 11))),
        Expanded(flex: 2, child: Text(fmt.format(holding.totalValue), textAlign: TextAlign.right, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold))),
        Expanded(child: Text('${isGain ? "+" : ""}${holding.profitPercent.toStringAsFixed(1)}%', 
          textAlign: TextAlign.right, 
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: isGain ? Colors.green : Colors.redAccent))),
      ]),
    );
  }
}
