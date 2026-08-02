import { TRANSACTION_TYPE, RULE_TYPE, FREQUENCY } from './constants';

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    skip: number;
    limit: number;
}

export interface Currency {
    code: string;
    name: string;
    symbol: string;
}

export interface User {
    user_id: string;
    email: string;
    full_name?: string;
}

export interface Category {
    category_id: number;
    name: string;
}

export interface UserSettings {
    setting_id?: number;
    user_id?: string;
    default_currency: string;
    exchange_provider: string;
}


// Investment Holding Data
export interface InvestmentHolding {
    holding_id: number;
    account_id: string;
    symbol: string;
    name: string;
    quantity: number;
    average_price: number;
    current_price?: number;
    currency: string;
    stock_exchange?: string;
    last_price_update?: string;
    asset_type: string;
    unit: string;
    price_source: 'MANUAL' | 'MARKET';
    metadata_?: Record<string, unknown>;
}

export type CreateHoldingDTO = Omit<InvestmentHolding, 'holding_id' | 'account_id'>;
export type HoldingUpsertPayload = Omit<InvestmentHolding, 'holding_id' | 'last_price_update'> & {
    transaction_date?: string;
};

// Base Account
export interface Account {
    account_id: string;
    account_name?: string;
    account_type: string;
    currency: string;
    status: string;
    is_interest_enabled: boolean;
    created_at: string;
    balance?: number;
    asset_value?: number;
    net_value?: number;
    account_nature?: 'ASSET' | 'LIABILITY';
    metadata_?: Record<string, any>;
    investment_holdings?: InvestmentHolding[];
    asset_holdings?: InvestmentHolding[];
    interest_policy?: InterestPolicy;
}

export interface InterestPolicy {
    policy_id?: number;
    account_id?: string;
    enabled: boolean;
    direction: 'EARNED' | 'CHARGED';
    annual_rate: number;
    balance_basis: 'LEDGER_BALANCE' | 'FIXED_PRINCIPAL' | 'PRINCIPAL_OUTSTANDING';
    day_count: 'ACTUAL_365' | 'ACTUAL_ACTUAL' | 'THIRTY_360';
    treatment: 'CAPITALIZE' | 'PAYOUT' | 'INTEREST_DUE';
    settlement_frequency: Frequency;
    payout_account_id?: string | null;
    category_id?: number | null;
    effective_from: string;
    end_date?: string | null;
    calculation_version?: number;
}

export interface InterestPreview {
    period_start: string;
    period_end: string;
    days: number;
    eligible_balance: number | string;
    estimated_interest: number | string;
    projected_maturity_amount?: number | string | null;
    calculation_version: number;
}

export interface AccountTypeDefinition {
    key: string;
    label: string;
    nature: 'ASSET' | 'LIABILITY';
    supports_holdings: boolean;
    supports_interest: boolean;
    valuation_mode: 'LEDGER' | 'HOLDINGS';
}

export interface Transaction {
    transaction_id: number;
    account_id: string;
    amount: number;
    transaction_type: typeof TRANSACTION_TYPE.DEBIT | typeof TRANSACTION_TYPE.CREDIT;
    description?: string;
    additional_info?: string;
    transfer_id?: string;
    category_id?: number | null;
    category?: Category;
    transaction_date: string;
    currency: string;
    transaction_kind?: string;
}

export type CreateAccountDTO = Omit<Account, 'account_id' | 'created_at'>;
export type CreateTransactionDTO = Omit<Transaction, 'transaction_id' | 'transaction_date' | 'category' | 'currency'>;



export type AccountType = string;
export type RuleType = typeof RULE_TYPE[keyof typeof RULE_TYPE];
export type Frequency = typeof FREQUENCY[keyof typeof FREQUENCY];

export interface Rule {
    rule_id: number;
    account_id: string;
    name: string;
    is_active: boolean;
    rule_type: RuleType;

    // Schema is flattened by configuration in backend
    configuration?: Record<string, any> & {
        source_account_id?: string;
        target_account_id?: string;
    };
    category_name?: string;
    next_run_at?: string;
    execution_order: number;
}

export interface InterestRuleSchedule {
    rule_id: number;
    effective_from: string;
    end_date?: string | null;
    next_run_date?: string | null;
    execution_order: number;
    settlement_time_utc: string;
    replay_from_dates: string[];
}

export interface CreateRuleDTO {
    account_id: string;
    name: string;
    is_active: boolean;
    rule_type: RuleType;
    configuration?: Record<string, any>;
}

// Summary API Types
export interface CategorySummary {
    name: string;
    total_amount: number;
    transaction_type: typeof TRANSACTION_TYPE.DEBIT | typeof TRANSACTION_TYPE.CREDIT;
}

export interface AccountSummary {
    account_id: string;
    account_name?: string;
    account_type: string;
    currency: string;
    categories: CategorySummary[];
}

export interface SummaryResponse {
    accounts: AccountSummary[];
}

// Upcoming payments / maturities
export interface UpcomingItem {
    date: string;
    kind: 'RULE' | 'MATURITY' | 'LOAN_END';
    name: string;
    account_id: string;
    account_name?: string;
    account_type: string;
    amount?: number | null;
    rule_id?: number | null;
}

// Budgets
// spent_by_currency is raw (unconverted) per-currency spend — convert with
// lib/currency.ts before comparing against `amount` (assumed to be set in
// the user's default currency).
export interface BudgetItem {
    budget_id: number;
    category_id: number;
    category_name?: string;
    amount: number;
    period_month: string; // "YYYY-MM"
    spent_by_currency: Record<string, number>;
}

export interface YearlyBudgetMonth {
    period_month: string; // "YYYY-MM"
    amount: number | null;
    spent_by_currency: Record<string, number>;
}

export interface YearlyBudgetCategory {
    category_id: number;
    category_name?: string;
    months: YearlyBudgetMonth[];
    total_amount: number;
    total_spent_by_currency: Record<string, number>;
}

// Rule execution history + dry-run preview
export interface RuleExecution {
    execution_id: number;
    rule_id: number;
    ran_at: string;
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    amount?: number | null;
    transaction_id?: number | null;
    transfer_id?: string | null;
    period_start?: string | null;
    period_end?: string | null;
    error?: string | null;
}

export interface RulePreview {
    rule_id: number;
    amount: number;
    is_debit: boolean;
    description: string;
    period_start?: string;
    period_end?: string;
    days: number;
    from_account_id?: string | null;
    to_account_id?: string | null;
}
