import 'package:freezed_annotation/freezed_annotation.dart';

part 'models.freezed.dart';
part 'models.g.dart';

class DoubleConverter implements JsonConverter<double, dynamic> {
  const DoubleConverter();
  @override
  double fromJson(dynamic json) {
    if (json is num) return json.toDouble();
    if (json is String) return double.tryParse(json) ?? 0.0;
    return 0.0;
  }
  @override
  dynamic toJson(double object) => object;
}

class OptionalDoubleConverter implements JsonConverter<double?, dynamic> {
  const OptionalDoubleConverter();
  @override
  double? fromJson(dynamic json) {
    if (json == null) return null;
    if (json is num) return json.toDouble();
    if (json is String) return double.tryParse(json);
    return null;
  }
  @override
  dynamic toJson(double? object) => object;
}

class IntConverter implements JsonConverter<int, dynamic> {
  const IntConverter();
  @override
  int fromJson(dynamic json) {
    if (json is int) return json;
    if (json is num) return json.toInt();
    if (json is String) return int.tryParse(json) ?? 0;
    return 0;
  }
  @override
  dynamic toJson(int object) => object;
}

class OptionalIntConverter implements JsonConverter<int?, dynamic> {
  const OptionalIntConverter();
  @override
  int? fromJson(dynamic json) {
    if (json == null) return null;
    if (json is int) return json;
    if (json is num) return json.toInt();
    if (json is String) return int.tryParse(json);
    return null;
  }
  @override
  dynamic toJson(int? object) => object;
}

// ─────────────────────────────────────────────────────────────────────────────
// Enums (mirror constants.ts)
// ─────────────────────────────────────────────────────────────────────────────

enum AccountType {
  @JsonValue('SAVINGS') savings,
  @JsonValue('INVESTMENT') investment,
  @JsonValue('FIXED_DEPOSIT') fixedDeposit,
  @JsonValue('LOAN') loan,
}

enum TransactionType {
  @JsonValue('DEBIT') debit,
  @JsonValue('CREDIT') credit,
  @JsonValue('TRANSFER') transfer,
}

enum RuleType {
  @JsonValue('CATEGORIZATION') categorization,
  @JsonValue('TRANSACTION') transaction,
  @JsonValue('CALCULATION') calculation,
}

enum Frequency {
  @JsonValue('DAILY') daily,
  @JsonValue('WEEKLY') weekly,
  @JsonValue('MONTHLY') monthly,
  @JsonValue('YEARLY') yearly,
  @JsonValue('ONE_TIME') oneTime,
}

// ─────────────────────────────────────────────────────────────────────────────
// Core models
// ─────────────────────────────────────────────────────────────────────────────

@freezed
sealed class PaginatedResponse<T> with _$PaginatedResponse<T> {
  const factory PaginatedResponse({
    required List<T> items,
    @IntConverter() required int total,
    @IntConverter() required int skip,
    @IntConverter() required int limit,
  }) = _PaginatedResponse<T>;
}

@freezed
sealed class Currency with _$Currency {
  const factory Currency({
    required String code,
    required String name,
    required String symbol,
  }) = _Currency;

  factory Currency.fromJson(Map<String, dynamic> json) => _$CurrencyFromJson(json);
}

@freezed
sealed class User with _$User {
  const factory User({
    @JsonKey(name: 'user_id') required String userId,
    required String email,
    @JsonKey(name: 'full_name') String? fullName,
  }) = _User;

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
}

@freezed
sealed class Category with _$Category {
  const factory Category({
    @IntConverter() @JsonKey(name: 'category_id') required int categoryId,
    required String name,
  }) = _Category;

  factory Category.fromJson(Map<String, dynamic> json) => _$CategoryFromJson(json);
}

@freezed
sealed class UserSettings with _$UserSettings {
  const factory UserSettings({
    @OptionalIntConverter() @JsonKey(name: 'setting_id') int? settingId,
    @JsonKey(name: 'user_id') String? userId,
    @JsonKey(name: 'default_currency') required String defaultCurrency,
    @JsonKey(name: 'exchange_provider') required String exchangeProvider,
  }) = _UserSettings;

  factory UserSettings.fromJson(Map<String, dynamic> json) => _$UserSettingsFromJson(json);
}

// ─────────────────────────────────────────────────────────────────────────────
// Account sub-types
// ─────────────────────────────────────────────────────────────────────────────

@freezed
sealed class SavingsAccount with _$SavingsAccount {
  const factory SavingsAccount({
    @JsonKey(name: 'account_id') required String accountId,
    @DoubleConverter() required double balance,
    @OptionalDoubleConverter() @JsonKey(name: 'interest_rate') double? interestRate,
    @OptionalDoubleConverter() @JsonKey(name: 'min_balance') double? minBalance,
    @OptionalIntConverter() @JsonKey(name: 'interest_accrual_day') int? interestAccrualDay,
  }) = _SavingsAccount;

  factory SavingsAccount.fromJson(Map<String, dynamic> json) => _$SavingsAccountFromJson(json);
}

@freezed
sealed class LoanAccount with _$LoanAccount {
  const factory LoanAccount({
    @JsonKey(name: 'account_id') required String accountId,
    @DoubleConverter() @JsonKey(name: 'loan_amount') required double loanAmount,
    @DoubleConverter() @JsonKey(name: 'outstanding_amount') required double outstandingAmount,
    @DoubleConverter() @JsonKey(name: 'interest_rate') required double interestRate,
    @IntConverter() @JsonKey(name: 'tenure_months') required int tenureMonths,
    @DoubleConverter() @JsonKey(name: 'emi_amount') required double emiAmount,
    @JsonKey(name: 'start_date') required String startDate,
    @OptionalIntConverter() @JsonKey(name: 'interest_accrual_day') int? interestAccrualDay,
  }) = _LoanAccount;

  factory LoanAccount.fromJson(Map<String, dynamic> json) => _$LoanAccountFromJson(json);
}

@freezed
sealed class FixedDepositAccount with _$FixedDepositAccount {
  const factory FixedDepositAccount({
    @JsonKey(name: 'account_id') required String accountId,
    @DoubleConverter() required double balance,
    @DoubleConverter() @JsonKey(name: 'principal_amount') required double principalAmount,
    @DoubleConverter() @JsonKey(name: 'interest_rate') required double interestRate,
    @JsonKey(name: 'start_date') required String startDate,
    @JsonKey(name: 'maturity_date') required String maturityDate,
    @DoubleConverter() @JsonKey(name: 'maturity_amount') required double maturityAmount,
    @OptionalIntConverter() @JsonKey(name: 'interest_accrual_day') int? interestAccrualDay,
  }) = _FixedDepositAccount;

  factory FixedDepositAccount.fromJson(Map<String, dynamic> json) =>
      _$FixedDepositAccountFromJson(json);
}

@freezed
sealed class InvestmentHolding with _$InvestmentHolding {
  const factory InvestmentHolding({
    @IntConverter() @JsonKey(name: 'holding_id') required int holdingId,
    @JsonKey(name: 'account_id') required String accountId,
    required String symbol,
    required String name,
    @DoubleConverter() required double quantity,
    @DoubleConverter() @JsonKey(name: 'average_price') required double averagePrice,
    @OptionalDoubleConverter() @JsonKey(name: 'current_price') double? currentPrice,
    required String currency,
    @JsonKey(name: 'stock_exchange') String? stockExchange,
    @JsonKey(name: 'last_price_update') String? lastPriceUpdate,
  }) = _InvestmentHolding;

  factory InvestmentHolding.fromJson(Map<String, dynamic> json) =>
      _$InvestmentHoldingFromJson(json);
}

@freezed
sealed class Account with _$Account {
  const factory Account({
    @JsonKey(name: 'account_id') required String accountId,
    @JsonKey(name: 'account_name') String? accountName,
    @JsonKey(name: 'account_type') required AccountType accountType,
    required String currency,
    required String status,
    @JsonKey(name: 'is_interest_enabled') required bool isInterestEnabled,
    @JsonKey(name: 'created_at') required String createdAt,
    @JsonKey(name: 'savings_account') SavingsAccount? savingsAccount,
    @JsonKey(name: 'loan_account') LoanAccount? loanAccount,
    @JsonKey(name: 'fixed_deposit_account') FixedDepositAccount? fixedDepositAccount,
    @JsonKey(name: 'investment_holdings') @Default([]) List<InvestmentHolding> investmentHoldings,
  }) = _Account;

  factory Account.fromJson(Map<String, dynamic> json) => _$AccountFromJson(json);
}

// ─────────────────────────────────────────────────────────────────────────────
// Transactions
// ─────────────────────────────────────────────────────────────────────────────

@freezed
sealed class Transaction with _$Transaction {
  const factory Transaction({
    @IntConverter() @JsonKey(name: 'transaction_id') required int transactionId,
    @JsonKey(name: 'account_id') required String accountId,
    @DoubleConverter() required double amount,
    @JsonKey(name: 'transaction_type') required TransactionType transactionType,
    String? description,
    @OptionalIntConverter() @JsonKey(name: 'category_id') int? categoryId,
    Category? category,
    @JsonKey(name: 'transaction_date') required String transactionDate,
    required String currency,
  }) = _Transaction;

  factory Transaction.fromJson(Map<String, dynamic> json) => _$TransactionFromJson(json);
}

// ─────────────────────────────────────────────────────────────────────────────
// Rules
// ─────────────────────────────────────────────────────────────────────────────

@freezed
sealed class Rule with _$Rule {
  const factory Rule({
    @IntConverter() @JsonKey(name: 'rule_id') required int ruleId,
    @JsonKey(name: 'account_id') required String accountId,
    required String name,
    @JsonKey(name: 'is_active') required bool isActive,
    @JsonKey(name: 'rule_type') required RuleType ruleType,
    @JsonKey(name: 'description_contains') String? descriptionContains,
    @OptionalIntConverter() @JsonKey(name: 'category_id') int? categoryId,
    @JsonKey(name: 'category_name') String? categoryName,
    Frequency? frequency,
    @JsonKey(name: 'next_run_at') String? nextRunAt,
    @JsonKey(name: 'end_date') String? endDate,
    @OptionalDoubleConverter() @JsonKey(name: 'transaction_amount') double? transactionAmount,
    @JsonKey(name: 'transaction_type') TransactionType? transactionType,
    @JsonKey(name: 'target_account_id') String? targetAccountId,
    String? formula,
  }) = _Rule;

  factory Rule.fromJson(Map<String, dynamic> json) => _$RuleFromJson(json);
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary
// ─────────────────────────────────────────────────────────────────────────────

@freezed
sealed class CategorySummary with _$CategorySummary {
  const factory CategorySummary({
    required String name,
    @DoubleConverter() @JsonKey(name: 'total_amount') required double totalAmount,
    @JsonKey(name: 'transaction_type') required TransactionType transactionType,
  }) = _CategorySummary;

  factory CategorySummary.fromJson(Map<String, dynamic> json) => _$CategorySummaryFromJson(json);
}

@freezed
sealed class AccountSummary with _$AccountSummary {
  const factory AccountSummary({
    @JsonKey(name: 'account_id') required String accountId,
    @JsonKey(name: 'account_name') String? accountName,
    @JsonKey(name: 'account_type') required AccountType accountType,
    required String currency,
    required List<CategorySummary> categories,
  }) = _AccountSummary;

  factory AccountSummary.fromJson(Map<String, dynamic> json) => _$AccountSummaryFromJson(json);
}

@freezed
sealed class SummaryResponse with _$SummaryResponse {
  const factory SummaryResponse({
    required List<AccountSummary> accounts,
  }) = _SummaryResponse;

  factory SummaryResponse.fromJson(Map<String, dynamic> json) => _$SummaryResponseFromJson(json);
}
