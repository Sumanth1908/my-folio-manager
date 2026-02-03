import { TRANSACTION_TYPE, RULE_TYPE, FREQUENCY, ACCOUNT_TYPE } from './constants';

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


// Savings Account Data
export interface SavingsAccount {
    account_id: string;
    balance: number;
    interest_rate?: number;
    min_balance?: number;
    interest_accrual_day?: number;
}

// Loan Account Data
export interface LoanAccount {
    account_id: string;
    loan_amount: number;
    outstanding_amount: number;
    interest_rate: number;
    tenure_months: number;
    emi_amount: number;
    start_date: string;
    interest_accrual_day?: number;
}

// Fixed Deposit Account Data
export interface FixedDepositAccount {
    account_id: string;
    principal_amount: number;
    interest_rate: number;
    start_date: string;
    maturity_date: string;
    maturity_amount: number;
    interest_accrual_day?: number;
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
}

export type CreateHoldingDTO = Omit<InvestmentHolding, 'holding_id' | 'account_id'>;

// Base Account
export interface Account {
    account_id: string;
    account_name?: string;
    account_type: typeof ACCOUNT_TYPE[keyof typeof ACCOUNT_TYPE];
    currency: string;
    status: string;
    is_interest_enabled: boolean;
    created_at: string;
    // Nested account details
    savings_account?: SavingsAccount;
    loan_account?: LoanAccount;
    fixed_deposit_account?: FixedDepositAccount;
    investment_holdings?: InvestmentHolding[];
}

export interface Transaction {
    transaction_id: number;
    account_id: string;
    amount: number;
    transaction_type: typeof TRANSACTION_TYPE.DEBIT | typeof TRANSACTION_TYPE.CREDIT;
    description?: string;
    category_id?: number | null;
    category?: Category;
    transaction_date: string;
    currency: string;
}

export type CreateAccountDTO = Omit<Account, 'account_id' | 'created_at'>;
export type CreateTransactionDTO = Omit<Transaction, 'transaction_id' | 'transaction_date' | 'category' | 'currency'>;



export type RuleType = typeof RULE_TYPE[keyof typeof RULE_TYPE];
export type Frequency = typeof FREQUENCY[keyof typeof FREQUENCY];

export interface Rule {
    rule_id: number;
    account_id: string;
    name: string;
    is_active: boolean;
    rule_type: RuleType;

    // Categorization
    description_contains?: string;
    category_id?: number;
    category_name?: string;

    // Automation
    frequency?: Frequency;
    next_run_at?: string;
    transaction_amount?: number;
    transaction_type?: typeof TRANSACTION_TYPE.DEBIT | typeof TRANSACTION_TYPE.CREDIT | typeof TRANSACTION_TYPE.TRANSFER;
    target_account_id?: string;

    // Calculation
    formula?: string;
}

export interface CreateRuleDTO {
    account_id: string;
    name: string;
    is_active: boolean;
    rule_type: RuleType;

    description_contains?: string;
    category_id?: number;

    frequency?: Frequency;
    next_run_at?: string;
    transaction_amount?: number;
    transaction_type?: typeof TRANSACTION_TYPE.DEBIT | typeof TRANSACTION_TYPE.CREDIT | typeof TRANSACTION_TYPE.TRANSFER;
    formula?: string;
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
    account_type: typeof ACCOUNT_TYPE[keyof typeof ACCOUNT_TYPE];
    currency: string;
    categories: CategorySummary[];
}

export interface SummaryResponse {
    accounts: AccountSummary[];
}
