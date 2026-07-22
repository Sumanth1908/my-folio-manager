// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_Currency _$CurrencyFromJson(Map<String, dynamic> json) => _Currency(
      code: json['code'] as String,
      name: json['name'] as String,
      symbol: json['symbol'] as String,
    );

Map<String, dynamic> _$CurrencyToJson(_Currency instance) => <String, dynamic>{
      'code': instance.code,
      'name': instance.name,
      'symbol': instance.symbol,
    };

_User _$UserFromJson(Map<String, dynamic> json) => _User(
      userId: json['user_id'] as String,
      email: json['email'] as String,
      fullName: json['full_name'] as String?,
    );

Map<String, dynamic> _$UserToJson(_User instance) => <String, dynamic>{
      'user_id': instance.userId,
      'email': instance.email,
      'full_name': instance.fullName,
    };

_Category _$CategoryFromJson(Map<String, dynamic> json) => _Category(
      categoryId: const IntConverter().fromJson(json['category_id']),
      name: json['name'] as String,
    );

Map<String, dynamic> _$CategoryToJson(_Category instance) => <String, dynamic>{
      'category_id': const IntConverter().toJson(instance.categoryId),
      'name': instance.name,
    };

_UserSettings _$UserSettingsFromJson(Map<String, dynamic> json) =>
    _UserSettings(
      settingId: const OptionalIntConverter().fromJson(json['setting_id']),
      userId: json['user_id'] as String?,
      defaultCurrency: json['default_currency'] as String,
      exchangeProvider: json['exchange_provider'] as String,
    );

Map<String, dynamic> _$UserSettingsToJson(_UserSettings instance) =>
    <String, dynamic>{
      'setting_id': const OptionalIntConverter().toJson(instance.settingId),
      'user_id': instance.userId,
      'default_currency': instance.defaultCurrency,
      'exchange_provider': instance.exchangeProvider,
    };

_SavingsAccount _$SavingsAccountFromJson(Map<String, dynamic> json) =>
    _SavingsAccount(
      accountId: json['account_id'] as String,
      balance: const DoubleConverter().fromJson(json['balance']),
      interestRate:
          const OptionalDoubleConverter().fromJson(json['interest_rate']),
      minBalance: const OptionalDoubleConverter().fromJson(json['min_balance']),
      interestAccrualDay:
          const OptionalIntConverter().fromJson(json['interest_accrual_day']),
    );

Map<String, dynamic> _$SavingsAccountToJson(_SavingsAccount instance) =>
    <String, dynamic>{
      'account_id': instance.accountId,
      'balance': const DoubleConverter().toJson(instance.balance),
      'interest_rate':
          const OptionalDoubleConverter().toJson(instance.interestRate),
      'min_balance':
          const OptionalDoubleConverter().toJson(instance.minBalance),
      'interest_accrual_day':
          const OptionalIntConverter().toJson(instance.interestAccrualDay),
    };

_LoanAccount _$LoanAccountFromJson(Map<String, dynamic> json) => _LoanAccount(
      accountId: json['account_id'] as String,
      loanAmount: const DoubleConverter().fromJson(json['loan_amount']),
      outstandingAmount:
          const DoubleConverter().fromJson(json['outstanding_amount']),
      interestRate: const DoubleConverter().fromJson(json['interest_rate']),
      tenureMonths: const IntConverter().fromJson(json['tenure_months']),
      emiAmount: const DoubleConverter().fromJson(json['emi_amount']),
      startDate: json['start_date'] as String,
      interestAccrualDay:
          const OptionalIntConverter().fromJson(json['interest_accrual_day']),
    );

Map<String, dynamic> _$LoanAccountToJson(_LoanAccount instance) =>
    <String, dynamic>{
      'account_id': instance.accountId,
      'loan_amount': const DoubleConverter().toJson(instance.loanAmount),
      'outstanding_amount':
          const DoubleConverter().toJson(instance.outstandingAmount),
      'interest_rate': const DoubleConverter().toJson(instance.interestRate),
      'tenure_months': const IntConverter().toJson(instance.tenureMonths),
      'emi_amount': const DoubleConverter().toJson(instance.emiAmount),
      'start_date': instance.startDate,
      'interest_accrual_day':
          const OptionalIntConverter().toJson(instance.interestAccrualDay),
    };

_FixedDepositAccount _$FixedDepositAccountFromJson(Map<String, dynamic> json) =>
    _FixedDepositAccount(
      accountId: json['account_id'] as String,
      balance: const DoubleConverter().fromJson(json['balance']),
      principalAmount:
          const DoubleConverter().fromJson(json['principal_amount']),
      interestRate: const DoubleConverter().fromJson(json['interest_rate']),
      startDate: json['start_date'] as String,
      maturityDate: json['maturity_date'] as String,
      maturityAmount: const DoubleConverter().fromJson(json['maturity_amount']),
      interestAccrualDay:
          const OptionalIntConverter().fromJson(json['interest_accrual_day']),
    );

Map<String, dynamic> _$FixedDepositAccountToJson(
        _FixedDepositAccount instance) =>
    <String, dynamic>{
      'account_id': instance.accountId,
      'balance': const DoubleConverter().toJson(instance.balance),
      'principal_amount':
          const DoubleConverter().toJson(instance.principalAmount),
      'interest_rate': const DoubleConverter().toJson(instance.interestRate),
      'start_date': instance.startDate,
      'maturity_date': instance.maturityDate,
      'maturity_amount':
          const DoubleConverter().toJson(instance.maturityAmount),
      'interest_accrual_day':
          const OptionalIntConverter().toJson(instance.interestAccrualDay),
    };

_InvestmentHolding _$InvestmentHoldingFromJson(Map<String, dynamic> json) =>
    _InvestmentHolding(
      holdingId: const IntConverter().fromJson(json['holding_id']),
      accountId: json['account_id'] as String,
      symbol: json['symbol'] as String,
      name: json['name'] as String,
      quantity: const DoubleConverter().fromJson(json['quantity']),
      averagePrice: const DoubleConverter().fromJson(json['average_price']),
      currentPrice:
          const OptionalDoubleConverter().fromJson(json['current_price']),
      currency: json['currency'] as String,
      stockExchange: json['stock_exchange'] as String?,
      lastPriceUpdate: json['last_price_update'] as String?,
    );

Map<String, dynamic> _$InvestmentHoldingToJson(_InvestmentHolding instance) =>
    <String, dynamic>{
      'holding_id': const IntConverter().toJson(instance.holdingId),
      'account_id': instance.accountId,
      'symbol': instance.symbol,
      'name': instance.name,
      'quantity': const DoubleConverter().toJson(instance.quantity),
      'average_price': const DoubleConverter().toJson(instance.averagePrice),
      'current_price':
          const OptionalDoubleConverter().toJson(instance.currentPrice),
      'currency': instance.currency,
      'stock_exchange': instance.stockExchange,
      'last_price_update': instance.lastPriceUpdate,
    };

_Account _$AccountFromJson(Map<String, dynamic> json) => _Account(
      accountId: json['account_id'] as String,
      accountName: json['account_name'] as String?,
      accountType: $enumDecode(_$AccountTypeEnumMap, json['account_type']),
      currency: json['currency'] as String,
      status: json['status'] as String,
      isInterestEnabled: json['is_interest_enabled'] as bool,
      createdAt: json['created_at'] as String,
      savingsAccount: json['savings_account'] == null
          ? null
          : SavingsAccount.fromJson(
              json['savings_account'] as Map<String, dynamic>),
      loanAccount: json['loan_account'] == null
          ? null
          : LoanAccount.fromJson(json['loan_account'] as Map<String, dynamic>),
      fixedDepositAccount: json['fixed_deposit_account'] == null
          ? null
          : FixedDepositAccount.fromJson(
              json['fixed_deposit_account'] as Map<String, dynamic>),
      investmentHoldings: (json['investment_holdings'] as List<dynamic>?)
              ?.map(
                  (e) => InvestmentHolding.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );

Map<String, dynamic> _$AccountToJson(_Account instance) => <String, dynamic>{
      'account_id': instance.accountId,
      'account_name': instance.accountName,
      'account_type': _$AccountTypeEnumMap[instance.accountType]!,
      'currency': instance.currency,
      'status': instance.status,
      'is_interest_enabled': instance.isInterestEnabled,
      'created_at': instance.createdAt,
      'savings_account': instance.savingsAccount,
      'loan_account': instance.loanAccount,
      'fixed_deposit_account': instance.fixedDepositAccount,
      'investment_holdings': instance.investmentHoldings,
    };

const _$AccountTypeEnumMap = {
  AccountType.savings: 'SAVINGS',
  AccountType.investment: 'INVESTMENT',
  AccountType.fixedDeposit: 'FIXED_DEPOSIT',
  AccountType.loan: 'LOAN',
};

_Transaction _$TransactionFromJson(Map<String, dynamic> json) => _Transaction(
      transactionId: const IntConverter().fromJson(json['transaction_id']),
      accountId: json['account_id'] as String,
      amount: const DoubleConverter().fromJson(json['amount']),
      transactionType:
          $enumDecode(_$TransactionTypeEnumMap, json['transaction_type']),
      description: json['description'] as String?,
      categoryId: const OptionalIntConverter().fromJson(json['category_id']),
      category: json['category'] == null
          ? null
          : Category.fromJson(json['category'] as Map<String, dynamic>),
      transactionDate: json['transaction_date'] as String,
      currency: json['currency'] as String,
    );

Map<String, dynamic> _$TransactionToJson(_Transaction instance) =>
    <String, dynamic>{
      'transaction_id': const IntConverter().toJson(instance.transactionId),
      'account_id': instance.accountId,
      'amount': const DoubleConverter().toJson(instance.amount),
      'transaction_type': _$TransactionTypeEnumMap[instance.transactionType]!,
      'description': instance.description,
      'category_id': const OptionalIntConverter().toJson(instance.categoryId),
      'category': instance.category,
      'transaction_date': instance.transactionDate,
      'currency': instance.currency,
    };

const _$TransactionTypeEnumMap = {
  TransactionType.debit: 'DEBIT',
  TransactionType.credit: 'CREDIT',
  TransactionType.transfer: 'TRANSFER',
};

_Rule _$RuleFromJson(Map<String, dynamic> json) => _Rule(
      ruleId: const IntConverter().fromJson(json['rule_id']),
      accountId: json['account_id'] as String,
      name: json['name'] as String,
      isActive: json['is_active'] as bool,
      ruleType: $enumDecode(_$RuleTypeEnumMap, json['rule_type']),
      descriptionContains: json['description_contains'] as String?,
      categoryId: const OptionalIntConverter().fromJson(json['category_id']),
      categoryName: json['category_name'] as String?,
      frequency: $enumDecodeNullable(_$FrequencyEnumMap, json['frequency']),
      nextRunAt: json['next_run_at'] as String?,
      endDate: json['end_date'] as String?,
      transactionAmount:
          const OptionalDoubleConverter().fromJson(json['transaction_amount']),
      transactionType: $enumDecodeNullable(
          _$TransactionTypeEnumMap, json['transaction_type']),
      targetAccountId: json['target_account_id'] as String?,
      formula: json['formula'] as String?,
    );

Map<String, dynamic> _$RuleToJson(_Rule instance) => <String, dynamic>{
      'rule_id': const IntConverter().toJson(instance.ruleId),
      'account_id': instance.accountId,
      'name': instance.name,
      'is_active': instance.isActive,
      'rule_type': _$RuleTypeEnumMap[instance.ruleType]!,
      'description_contains': instance.descriptionContains,
      'category_id': const OptionalIntConverter().toJson(instance.categoryId),
      'category_name': instance.categoryName,
      'frequency': _$FrequencyEnumMap[instance.frequency],
      'next_run_at': instance.nextRunAt,
      'end_date': instance.endDate,
      'transaction_amount':
          const OptionalDoubleConverter().toJson(instance.transactionAmount),
      'transaction_type': _$TransactionTypeEnumMap[instance.transactionType],
      'target_account_id': instance.targetAccountId,
      'formula': instance.formula,
    };

const _$RuleTypeEnumMap = {
  RuleType.categorization: 'CATEGORIZATION',
  RuleType.transaction: 'TRANSACTION',
  RuleType.calculation: 'CALCULATION',
};

const _$FrequencyEnumMap = {
  Frequency.daily: 'DAILY',
  Frequency.weekly: 'WEEKLY',
  Frequency.monthly: 'MONTHLY',
  Frequency.yearly: 'YEARLY',
  Frequency.oneTime: 'ONE_TIME',
};

_CategorySummary _$CategorySummaryFromJson(Map<String, dynamic> json) =>
    _CategorySummary(
      name: json['name'] as String,
      totalAmount: const DoubleConverter().fromJson(json['total_amount']),
      transactionType:
          $enumDecode(_$TransactionTypeEnumMap, json['transaction_type']),
    );

Map<String, dynamic> _$CategorySummaryToJson(_CategorySummary instance) =>
    <String, dynamic>{
      'name': instance.name,
      'total_amount': const DoubleConverter().toJson(instance.totalAmount),
      'transaction_type': _$TransactionTypeEnumMap[instance.transactionType]!,
    };

_AccountSummary _$AccountSummaryFromJson(Map<String, dynamic> json) =>
    _AccountSummary(
      accountId: json['account_id'] as String,
      accountName: json['account_name'] as String?,
      accountType: $enumDecode(_$AccountTypeEnumMap, json['account_type']),
      currency: json['currency'] as String,
      categories: (json['categories'] as List<dynamic>)
          .map((e) => CategorySummary.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$AccountSummaryToJson(_AccountSummary instance) =>
    <String, dynamic>{
      'account_id': instance.accountId,
      'account_name': instance.accountName,
      'account_type': _$AccountTypeEnumMap[instance.accountType]!,
      'currency': instance.currency,
      'categories': instance.categories,
    };

_SummaryResponse _$SummaryResponseFromJson(Map<String, dynamic> json) =>
    _SummaryResponse(
      accounts: (json['accounts'] as List<dynamic>)
          .map((e) => AccountSummary.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$SummaryResponseToJson(_SummaryResponse instance) =>
    <String, dynamic>{
      'accounts': instance.accounts,
    };
