import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/utils/money_format.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/models/models.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/settings_provider.dart';
import 'dashboard_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);
    final summaryAsync = ref.watch(dashboardSummaryProvider);
    final currencySymbol = ref.watch(currencySymbolProvider);
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Hello, ${user?.fullName?.split(' ').first ?? 'there'} 👋',
                style:
                    const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
            Text('Here\'s your financial overview',
                style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined),
            onPressed: () {
              ref.invalidate(dashboardTimeRangeNotifierProvider);
              ref.invalidate(dashboardSummaryProvider);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(dashboardTimeRangeNotifierProvider);
          return ref.refresh(dashboardSummaryProvider.future);
        },
        child: AnimatedSwitcher(
          duration: const Duration(milliseconds: 500),
          child: summaryAsync.when(
            loading: () => const Center(
                key: ValueKey('loading'), child: CircularProgressIndicator()),
            error: (e, _) => _ErrorView(
                key: const ValueKey('error'),
                message: e.toString(),
                onRetry: () {
                  ref.invalidate(dashboardTimeRangeNotifierProvider);
                  ref.invalidate(dashboardSummaryProvider);
                }),
            data: (summary) => _DashboardBody(
                key: const ValueKey('data'),
                summary: summary,
                currencySymbol: currencySymbol),
          ),
        ),
      ),
    );
  }
}

class _DashboardBody extends ConsumerWidget {
  final SummaryResponse summary;
  final String currencySymbol;
  const _DashboardBody(
      {super.key, required this.summary, required this.currencySymbol});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final range = ref.watch(dashboardTimeRangeNotifierProvider);
    final notifier = ref.read(dashboardTimeRangeNotifierProvider.notifier);

    // Aggregate global inflows and outflows across all accounts
    final Map<String, double> inflowsMap = {};
    final Map<String, double> outflowsMap = {};
    double totalInflow = 0;
    double totalOutflow = 0;

    // Aggregate global inflows and outflows ONLY for SAVINGS accounts
    for (final account in summary.accounts) {
      if (account.accountType != AccountType.savings) continue;
      
      for (final cat in account.categories) {
        if (cat.transactionType == TransactionType.credit) {
          inflowsMap[cat.name] = (inflowsMap[cat.name] ?? 0) + cat.totalAmount;
          totalInflow += cat.totalAmount;
        } else {
          outflowsMap[cat.name] =
              (outflowsMap[cat.name] ?? 0) + cat.totalAmount;
          totalOutflow += cat.totalAmount;
        }
      }
    }

    final cs = Theme.of(context).colorScheme;
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      children: [
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Overview',
                      style: TextStyle(
                          fontSize: 14,
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
                  onPressed: () =>
                      notifier.setRange(DashboardTimeRange.thisMonth),
                ),
                _RangeButton(
                  label: 'LAST MONTH',
                  isSelected: range == DashboardTimeRange.lastMonth,
                  onPressed: () =>
                      notifier.setRange(DashboardTimeRange.lastMonth),
                ),
                _RangeButton(
                  label: 'ALL TIME',
                  isSelected: range == DashboardTimeRange.allTime,
                  onPressed: () =>
                      notifier.setRange(DashboardTimeRange.allTime),
                ),
              ],
            ),
          ],
        ),
        const SizedBox(height: 20),

        // Cashflow Overview Card
        _CashflowOverviewCard(
          totalInflow: totalInflow,
          totalOutflow: totalOutflow,
          symbol: currencySymbol,
        ),

        const SizedBox(height: 32),

        // Cashflow Graph
        _SectionHeader(title: 'CASHFLOW FLOW'),
        const SizedBox(height: 16),
        _SankeyChartCard(
          inflows: inflowsMap,
          outflows: outflowsMap,
          symbol: currencySymbol,
        ),

        const SizedBox(height: 32),

        // Outflow Analysis (Pie chart)
        _SectionHeader(title: 'SPENDING BREAKDOWN'),
        const SizedBox(height: 16),
        _SpendingBreakdownCard(
          outflows: outflowsMap,
          symbol: currencySymbol,
        ),

        const SizedBox(height: 32),

        // Global Cashflow Breakdown
        _SectionHeader(title: 'CASHFLOW DETAILS'),
        const SizedBox(height: 12),
        _GlobalBreakdownCard(
          inflows: inflowsMap,
          outflows: outflowsMap,
          symbol: currencySymbol,
        ),

        const SizedBox(height: 32),
      ],
    );
  }
}

class _SankeyChartCard extends StatelessWidget {
  final Map<String, double> inflows;
  final Map<String, double> outflows;
  final String symbol;

  const _SankeyChartCard({
    required this.inflows,
    required this.outflows,
    required this.symbol,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    if (inflows.isEmpty && outflows.isEmpty) {
      return Card(
        child: Container(
          height: 200,
          alignment: Alignment.center,
          child: Text('Not enough data for chart',
              style: TextStyle(color: cs.onSurfaceVariant)),
        ),
      );
    }

    return Card(
      child: Container(
        height: 320,
        padding: const EdgeInsets.all(24),
        child: LayoutBuilder(
          builder: (context, constraints) {
            return CustomPaint(
              size: Size(constraints.maxWidth, constraints.maxHeight),
              painter: _SankeyPainter(
                inflows: inflows,
                outflows: outflows,
                symbol: symbol,
                colorScheme: cs,
              ),
            );
          },
        ),
      ),
    );
  }
}

class _SankeyPainter extends CustomPainter {
  final Map<String, double> inflows;
  final Map<String, double> outflows;
  final String symbol;
  final ColorScheme colorScheme;

  _SankeyPainter({
    required this.inflows,
    required this.outflows,
    required this.symbol,
    required this.colorScheme,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final totalInflow = inflows.values.fold(0.0, (s, v) => s + v);
    final totalOutflow = outflows.values.fold(0.0, (s, v) => s + v);
    final surplus = (totalInflow - totalOutflow).clamp(0.0, double.infinity);
    final totalAmount =
        totalInflow > 0 ? totalInflow : (totalOutflow > 0 ? totalOutflow : 1.0);

    const double nodeWidth = 10.0;
    final double chartWidth = size.width;
    final double chartHeight = size.height - 40;

    final double leftX = 0;
    final double centerX = chartWidth / 2 - nodeWidth / 2;
    final double rightX = chartWidth - nodeWidth;

    // Colors
    final isDark = colorScheme.brightness == Brightness.dark;
    final inflowColor =
        isDark ? const Color(0xFF34D399) : const Color(0xFF15803D); // Emerald
    final cashflowColor =
        isDark ? const Color(0xFF818CF8) : const Color(0xFF4F46E5); // Indigo
    final surplusColor = inflowColor;
    final List<Color> outflowColors = isDark
        ? [
            const Color(0xFFF87171),
            const Color(0xFFFB923C),
            const Color(0xFFFBBF24),
            const Color(0xFF60A5FA),
            const Color(0xFF818CF8),
            const Color(0xFFA78BFA),
          ]
        : [
            const Color(0xFFDC2626),
            const Color(0xFFEA580C),
            const Color(0xFFD97706),
            const Color(0xFF2563EB),
            const Color(0xFF4F46E5),
            const Color(0xFF7C3AED),
          ];

    // Central Node
    final double centerNodeHeight = chartHeight * 0.7;
    final double centerY = (chartHeight - centerNodeHeight) / 2 + 20;
    _drawNode(canvas, centerX, centerY, nodeWidth, centerNodeHeight,
        cashflowColor, "Cash Flow");

    // Left Side: Inflows
    double currentLeftY = centerY;
    inflows.forEach((name, amount) {
      final double flowHeight = (amount / totalAmount) * centerNodeHeight;
      if (flowHeight > 1) {
        _drawNode(canvas, leftX, currentLeftY, nodeWidth, flowHeight * 0.9,
            inflowColor, name,
            isLeft: true);
        _drawFlow(
            canvas,
            leftX + nodeWidth,
            currentLeftY,
            centerX,
            currentLeftY,
            nodeWidth,
            flowHeight * 0.9,
            inflowColor.withValues(alpha: 0.2));
        currentLeftY += flowHeight;
      }
    });

    // Right Side: Outflows + Surplus
    double currentRightInY = centerY;
    int idx = 0;
    outflows.forEach((name, amount) {
      final double flowHeight = (amount / totalAmount) * centerNodeHeight;
      if (flowHeight > 1) {
        final color = outflowColors[idx % outflowColors.length];
        _drawNode(canvas, rightX, currentRightInY, nodeWidth, flowHeight * 0.9,
            color, name,
            isLeft: false);
        _drawFlow(
            canvas,
            centerX + nodeWidth,
            currentRightInY,
            rightX,
            currentRightInY,
            nodeWidth,
            flowHeight * 0.9,
            color.withValues(alpha: 0.2));
        currentRightInY += flowHeight;
        idx++;
      }
    });

    if (surplus > 0) {
      final double flowHeight = (surplus / totalAmount) * centerNodeHeight;
      _drawNode(canvas, rightX, currentRightInY, nodeWidth, flowHeight * 0.9,
          surplusColor, "Surplus",
          isLeft: false);
      _drawFlow(
          canvas,
          centerX + nodeWidth,
          currentRightInY,
          rightX,
          currentRightInY,
          nodeWidth,
          flowHeight * 0.9,
          surplusColor.withValues(alpha: 0.2));
    }
  }

  void _drawNode(Canvas canvas, double x, double y, double w, double h,
      Color color, String name,
      {bool? isLeft}) {
    if (h < 0.5) return;
    
    final paint = Paint()..color = color;
    canvas.drawRRect(
        RRect.fromRectAndRadius(
            Rect.fromLTWH(x, y, w, h), const Radius.circular(3)),
        paint);

    if (isLeft != null) {
      // Innovative Labeling: Use staggered offsets if nodes are too close
      final textStyle = TextStyle(
          color: colorScheme.onSurface,
          fontSize: 7.5,
          fontWeight: FontWeight.w900,
          letterSpacing: 0.2);

      final textPainter = TextPainter(
        text: TextSpan(
          text: name.toUpperCase(),
          style: textStyle,
        ),
        textDirection: ui.TextDirection.ltr,
        maxLines: 1,
        ellipsis: '...',
      )..layout(maxWidth: 60);

      // Smart positioning:
      // If node is extremely small, don't overlap - use an vertical staggered approach
      final double verticalShift = h < 8 ? (y % 10 - 5) : 0;
      final double horizontalPush = isLeft ? 10 : -10;
      
      // Draw a connecting hairline if shifted
      if (h < 8) {
        final linePaint = Paint()
          ..color = color.withValues(alpha: 0.4)
          ..strokeWidth = 0.5;
        canvas.drawLine(
          Offset(isLeft ? x + w : x, y + h / 2),
          Offset(isLeft ? x + w + 6 : x - 6, y + h / 2 + verticalShift),
          linePaint
        );
      }

      final textX = isLeft ? x + w + 8 : x - textPainter.width - 8;
      final textY = y + h / 2 - textPainter.height / 2 + verticalShift;
      
      // Only draw if height is not completely invisible
      if (h > 1.5 || (y % 20 < 5)) { // Heuristic to show some labels for density
         textPainter.paint(canvas, Offset(textX, textY));
      }
    }
  }

  void _drawFlow(Canvas canvas, double x1, double y1, double x2, double y2,
      double nodeW, double h, Color color) {
    if (h < 2) return;
    final path = Path();
    path.moveTo(x1, y1);
    path.cubicTo(x1 + (x2 - x1) * 0.4, y1, x1 + (x2 - x1) * 0.6, y2, x2, y2);
    path.lineTo(x2, y2 + h);
    path.cubicTo(
        x1 + (x2 - x1) * 0.6, y2 + h, x1 + (x2 - x1) * 0.4, y1 + h, x1, y1 + h);
    path.close();

    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.fill;
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}

class _SpendingBreakdownCard extends StatelessWidget {
  final Map<String, double> outflows;
  final String symbol;

  const _SpendingBreakdownCard({
    required this.outflows,
    required this.symbol,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    if (outflows.isEmpty) return const SizedBox.shrink();

    final sortedItems = outflows.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));
    final topItems = sortedItems.take(5).toList();
    final totalOutflow = outflows.values.fold(0.0, (sum, v) => sum + v);

    final isDark = cs.brightness == Brightness.dark;
    final colors = isDark
        ? [
            const Color(0xFF818CF8),
            const Color(0xFFF472B6),
            const Color(0xFFFB923C),
            const Color(0xFF34D399),
            const Color(0xFF60A5FA),
          ]
        : [
            const Color(0xFF4F46E5),
            const Color(0xFFDB2777),
            const Color(0xFFEA580C),
            const Color(0xFF059669),
            const Color(0xFF2563EB),
          ];

    return Card(
      child: Container(
        height: 260,
        padding: const EdgeInsets.all(24),
        child: Row(
          children: [
            Expanded(
              flex: 3,
              child: PieChart(
                PieChartData(
                  sections: topItems.asMap().entries.map((e) {
                    final idx = e.key;
                    final val = e.value.value;
                    return PieChartSectionData(
                      color: colors[idx % colors.length],
                      value: val,
                      title:
                          '${(val / totalOutflow * 100).toStringAsFixed(0)}%',
                      radius: 40,
                      showTitle: true,
                      titleStyle: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w800,
                          color: Colors.white),
                    );
                  }).toList(),
                  sectionsSpace: 2,
                  centerSpaceRadius: 35,
                ),
              ),
            ),
            const SizedBox(width: 24),
            Expanded(
              flex: 4,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: topItems.asMap().entries.map((e) {
                  final idx = e.key;
                  final name = e.value.key;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        Container(
                            width: 10,
                            height: 10,
                            decoration: BoxDecoration(
                                color: colors[idx % colors.length],
                                borderRadius: BorderRadius.circular(3))),
                        const SizedBox(width: 10),
                        Expanded(
                            child: Text(name,
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: cs.onSurfaceVariant),
                                overflow: TextOverflow.ellipsis)),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CashflowOverviewCard extends StatelessWidget {
  final double totalInflow;
  final double totalOutflow;
  final String symbol;

  const _CashflowOverviewCard({
    required this.totalInflow,
    required this.totalOutflow,
    required this.symbol,
  });

  @override
  Widget build(BuildContext context) {
    final net = totalInflow - totalOutflow;
    final isPositive = net >= 0;
    final fmt = MoneyFormat(symbol: symbol);
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final greenColor = isDark
        ? const Color(0xFF34D399)
        : const Color(0xFF15803D); // Emerald 700
    final redColor =
        isDark ? const Color(0xFFF87171) : const Color(0xFFB91C1C); // Red 700

    return Container(
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isDark
              ? [
                  cs.surfaceContainerHigh,
                  cs.surfaceContainerLow,
                ]
              : [
                  cs.primary.withValues(alpha: 0.1),
                  cs.primary.withValues(alpha: 0.02),
                ],
        ),
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: cs.outlineVariant, width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text('NET SAVINGS',
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.5,
                      color: cs.onSurfaceVariant)),
              const Spacer(),
              Icon(isPositive ? Icons.trending_up : Icons.trending_down,
                  color: isPositive ? greenColor : redColor, size: 16),
            ],
          ),
          const SizedBox(height: 8),
          Text(fmt.format(net),
              style: TextStyle(
                fontSize: 34,
                fontWeight: FontWeight.w900,
                color: cs.onSurface,
                fontFeatures: [ui.FontFeature.tabularFigures()],
                letterSpacing: -1,
              )),
          const SizedBox(height: 24),
          Row(
            children: [
              _InflowOutflowMini(
                label: 'Inflow',
                value: fmt.format(totalInflow),
                color: greenColor,
                icon: Icons.south_west,
              ),
              const SizedBox(width: 32),
              _InflowOutflowMini(
                label: 'Outflow',
                value: fmt.format(totalOutflow),
                color: redColor,
                icon: Icons.north_east,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _InflowOutflowMini extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final IconData icon;
  const _InflowOutflowMini(
      {required this.label,
      required this.value,
      required this.color,
      required this.icon});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
            Text(label,
                style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: cs.onSurfaceVariant)),
          ],
        ),
        Text(value,
            style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w800,
                color: color,
                fontFeatures: [ui.FontFeature.tabularFigures()])),
      ],
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(title,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w900,
          color: Theme.of(context).colorScheme.onSurfaceVariant,
          letterSpacing: 1.8,
        ));
  }
}

class _GlobalBreakdownCard extends StatelessWidget {
  final Map<String, double> inflows;
  final Map<String, double> outflows;
  final String symbol;

  const _GlobalBreakdownCard({
    required this.inflows,
    required this.outflows,
    required this.symbol,
  });

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final fmt = MoneyFormat(symbol: symbol).consolidated;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: cs.outlineVariant)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          _BreakdownRow(
              title: 'Inflows', items: inflows, color: Colors.green, fmt: fmt),
          const Divider(height: 32),
          _BreakdownRow(
              title: 'Outflows',
              items: outflows,
              color: Colors.redAccent,
              fmt: fmt),
        ]),
      ),
    );
  }
}

class _BreakdownRow extends StatelessWidget {
  final String title;
  final Map<String, double> items;
  final Color color;
  final MoneyFormat fmt;

  const _BreakdownRow({
    required this.title,
    required this.items,
    required this.color,
    required this.fmt,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty)
      return Text('No $title',
          style: TextStyle(
              fontSize: 12,
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontStyle: FontStyle.italic));

    final sorted = items.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title.toUpperCase(),
          style: TextStyle(
              fontSize: 10, fontWeight: FontWeight.w900, color: color)),
      const SizedBox(height: 8),
      ...sorted.take(5).map((e) => Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(children: [
              Expanded(
                  child: Text(e.key, style: const TextStyle(fontSize: 13))),
              Text(fmt.format(e.value),
                  style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      fontFeatures: [ui.FontFeature.tabularFigures()])),
            ]),
          )),
    ]);
  }
}

class _ErrorView extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorView({super.key, required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(Icons.error_outline, size: 48, color: cs.error),
        const SizedBox(height: 12),
        Text(message,
            textAlign: TextAlign.center,
            style: TextStyle(color: cs.onSurfaceVariant)),
        const SizedBox(height: 16),
        OutlinedButton.icon(
            onPressed: onRetry,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry')),
      ]),
    );
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
