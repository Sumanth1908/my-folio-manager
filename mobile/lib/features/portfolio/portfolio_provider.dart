import 'package:riverpod_annotation/riverpod_annotation.dart';
import '../../core/models/models.dart';
import '../../core/providers/settings_provider.dart';
import '../accounts/accounts_provider.dart';

part 'portfolio_provider.g.dart';

class BalanceItem {
  final String id;
  final String name;
  final double value;
  final double weight;
  final List<SubAccount> accounts;

  BalanceItem({
    required this.id,
    required this.name,
    required this.value,
    required this.weight,
    required this.accounts,
  });
}

class SubAccount {
  final String id;
  final String name;
  final double value;
  final double weight;
  final List<SubHolding> holdings;

  SubAccount({
    required this.id,
    required this.name,
    required this.value,
    required this.weight,
    required this.holdings,
  });
}

class SubHolding {
  final String id;
  final String name;
  final String symbol;
  final double value;
  final double weight;

  SubHolding({
    required this.id,
    required this.name,
    required this.symbol,
    required this.value,
    required this.weight,
  });
}

class BalanceSheet {
  final double netWorth;
  final double totalAssets;
  final double totalLiabilities;
  final List<BalanceItem> assets;
  final List<BalanceItem> liabilities;
  final List<AggregatedHolding> aggregatedHoldings;

  BalanceSheet({
    required this.netWorth,
    required this.totalAssets,
    required this.totalLiabilities,
    required this.assets,
    required this.liabilities,
    required this.aggregatedHoldings,
  });
}

class AggregatedHolding {
  final String symbol;
  final String name;
  double totalQuantity;
  double totalValue;
  double totalCost;
  final String currency;

  AggregatedHolding({
    required this.symbol,
    required this.name,
    required this.totalQuantity,
    required this.totalValue,
    required this.totalCost,
    required this.currency,
  });

  double get profit => totalValue - totalCost;
  double get profitPercent => totalCost > 0 ? (profit / totalCost * 100) : 0.0;
}

@riverpod
Future<BalanceSheet> balanceSheet(BalanceSheetRef ref) async {
  final accounts = await ref.watch(accountsListProvider.future);
  final settings = await ref.watch(userSettingsProvider.future);
  final rates = await ref.watch(exchangeRatesProvider.future);
  
  final defaultCurrency = settings.defaultCurrency;
  
  double convert(double amount, String fromCurrency) {
    if (fromCurrency == defaultCurrency) return amount;
    final rate = rates[fromCurrency];
    if (rate == null) return amount;
    return amount / rate;
  }

  final Map<AccountType, List<Account>> assetGroups = {
    AccountType.savings: [],
    AccountType.fixedDeposit: [],
    AccountType.investment: [],
  };
  
  final List<Account> liabilityAccounts = [];
  final Map<String, AggregatedHolding> holdingsMap = {};

  double totalAssets = 0;
  double totalLiabilities = 0;

  for (final account in accounts) {
    double balance = 0;
    List<SubHolding> subHoldings = [];

    if (account.accountType == AccountType.savings && account.savingsAccount != null) {
      balance = account.savingsAccount!.balance;
    } else if (account.accountType == AccountType.fixedDeposit && account.fixedDepositAccount != null) {
      balance = account.fixedDepositAccount!.principalAmount;
    } else if (account.accountType == AccountType.investment && account.investmentHoldings != null) {
      for (final h in account.investmentHoldings!) {
        final currentPrice = h.currentPrice ?? h.averagePrice;
        final valOriginal = h.quantity * currentPrice;
        final costOriginal = h.quantity * h.averagePrice;
        
        balance += valOriginal;
        
        // Aggregate for active holdings analysis
        if (holdingsMap.containsKey(h.symbol)) {
          final existing = holdingsMap[h.symbol]!;
          existing.totalQuantity += h.quantity;
          existing.totalValue += convert(valOriginal, h.currency);
          existing.totalCost += convert(costOriginal, h.currency);
        } else {
          holdingsMap[h.symbol] = AggregatedHolding(
            symbol: h.symbol,
            name: h.name,
            totalQuantity: h.quantity,
            totalValue: convert(valOriginal, h.currency),
            totalCost: convert(costOriginal, h.currency),
            currency: h.currency,
          );
        }
      }
    } else if (account.accountType == AccountType.loan && account.loanAccount != null) {
      balance = account.loanAccount!.outstandingAmount;
    }

    final convertedValue = convert(balance, account.currency);

    if (account.accountType == AccountType.loan) {
      totalLiabilities += convertedValue;
      liabilityAccounts.add(account);
    } else if (assetGroups.containsKey(account.accountType)) {
      totalAssets += convertedValue;
      assetGroups[account.accountType]!.add(account);
    }
  }

  List<SubAccount> mapToSubAccounts(List<Account> groupAccounts, double groupTotal) {
    return groupAccounts.map((acc) {
      double bal = 0;
      List<SubHolding> hds = [];

      if (acc.accountType == AccountType.savings && acc.savingsAccount != null) {
        bal = acc.savingsAccount!.balance;
      } else if (acc.accountType == AccountType.fixedDeposit && acc.fixedDepositAccount != null) {
        bal = acc.fixedDepositAccount!.principalAmount;
      } else if (acc.accountType == AccountType.investment && acc.investmentHoldings != null) {
        for (final h in acc.investmentHoldings!) {
          final valOriginal = h.quantity * (h.currentPrice ?? h.averagePrice);
          bal += valOriginal;
          hds.add(SubHolding(
            id: h.holdingId.toString(),
            name: h.name,
            symbol: h.symbol,
            value: convert(valOriginal, h.currency),
            weight: 0, // Calculated later
          ));
        }
      } else if (acc.accountType == AccountType.loan && acc.loanAccount != null) {
        bal = acc.loanAccount!.outstandingAmount;
      }

      final convertedBal = convert(bal, acc.currency);
      return SubAccount(
        id: acc.accountId,
        name: acc.accountName ?? 'Unnamed',
        value: convertedBal,
        weight: groupTotal > 0 ? (convertedBal / groupTotal * 100) : 0,
        holdings: hds,
      );
    }).toList()..sort((a, b) => b.value.compareTo(a.value));
  }

  final List<BalanceItem> assets = [];
  assetGroups.forEach((type, groupAccounts) {
    if (groupAccounts.isNotEmpty) {
      double groupTotal = groupAccounts.fold(0.0, (sum, acc) {
        double bal = 0;
        if (acc.accountType == AccountType.savings) bal = acc.savingsAccount!.balance;
        else if (acc.accountType == AccountType.fixedDeposit) bal = acc.fixedDepositAccount!.principalAmount;
        else if (acc.accountType == AccountType.investment) bal = acc.investmentHoldings!.fold(0.0, (s, h) => s + (h.quantity * (h.currentPrice ?? h.averagePrice)));
        return sum + convert(bal, acc.currency);
      });

      assets.add(BalanceItem(
        id: type.name,
        name: type.name.toUpperCase(),
        value: groupTotal,
        weight: totalAssets > 0 ? (groupTotal / totalAssets * 100) : 0,
        accounts: mapToSubAccounts(groupAccounts, groupTotal),
      ));
    }
  });
  assets.sort((a, b) => b.value.compareTo(a.value));

  final List<BalanceItem> liabilities = [];
  if (liabilityAccounts.isNotEmpty) {
    liabilities.add(BalanceItem(
      id: 'LOAN',
      name: 'LOANS',
      value: totalLiabilities,
      weight: 100,
      accounts: mapToSubAccounts(liabilityAccounts, totalLiabilities),
    ));
  }

  return BalanceSheet(
    netWorth: totalAssets - totalLiabilities,
    totalAssets: totalAssets,
    totalLiabilities: totalLiabilities,
    assets: assets,
    liabilities: liabilities,
    aggregatedHoldings: holdingsMap.values.toList()..sort((a, b) => b.totalValue.compareTo(a.totalValue)),
  );
}
