from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.account import AccountType
from app.schemas.investment import InvestmentHoldingRead


# --- Savings Account ---

class SavingsAccountBase(BaseModel):
    interest_rate: Decimal | None = None
    min_balance: Decimal = Decimal("0.00")
    interest_accrual_day: int = 1

class SavingsAccountCreate(SavingsAccountBase):
    pass

class SavingsAccountRead(SavingsAccountBase):
    model_config = ConfigDict(from_attributes=True)
    account_id: str
    balance: Decimal = Decimal("0.00")

class SavingsAccountUpdate(BaseModel):
    interest_rate: Decimal | None = None
    min_balance: Decimal | None = None
    interest_accrual_day: int | None = None


# --- Loan Account ---

class LoanAccountBase(BaseModel):
    loan_amount: Decimal
    interest_rate: Decimal
    tenure_months: int
    emi_amount: Decimal
    start_date: date
    interest_accrual_day: int = 1

class LoanAccountCreate(LoanAccountBase):
    pass

class LoanAccountRead(LoanAccountBase):
    model_config = ConfigDict(from_attributes=True)
    account_id: str
    outstanding_amount: Decimal = Decimal("0.00")

class LoanAccountUpdate(BaseModel):
    loan_amount: Decimal | None = None
    interest_rate: Decimal | None = None
    tenure_months: int | None = None
    emi_amount: Decimal | None = None
    start_date: date | None = None
    interest_accrual_day: int | None = None


# --- Fixed Deposit ---

class FixedDepositAccountBase(BaseModel):
    principal_amount: Decimal
    interest_rate: Decimal
    start_date: date
    maturity_date: date
    maturity_amount: Decimal
    interest_accrual_day: int = 1

class FixedDepositAccountCreate(FixedDepositAccountBase):
    pass

class FixedDepositAccountRead(FixedDepositAccountBase):
    model_config = ConfigDict(from_attributes=True)
    account_id: str
    balance: Decimal = Decimal("0.00")

class FixedDepositAccountUpdate(BaseModel):
    principal_amount: Decimal | None = None
    interest_rate: Decimal | None = None
    start_date: date | None = None
    maturity_date: date | None = None
    maturity_amount: Decimal | None = None
    interest_accrual_day: int | None = None


# --- Main Account ---

class AccountBase(BaseModel):
    account_name: str | None = None
    account_type: AccountType = AccountType.SAVINGS
    currency: str = "USD"
    status: str = "Active"
    is_interest_enabled: bool = False

class AccountCreate(AccountBase):
    savings_account: SavingsAccountCreate | None = None
    loan_account: LoanAccountCreate | None = None
    fixed_deposit_account: FixedDepositAccountCreate | None = None

class AccountUpdate(BaseModel):
    account_name: str | None = None
    currency: str | None = None
    status: str | None = None
    savings_account: SavingsAccountUpdate | None = None
    loan_account: LoanAccountUpdate | None = None
    fixed_deposit_account: FixedDepositAccountUpdate | None = None

class AccountRead(AccountBase):
    model_config = ConfigDict(from_attributes=True)
    account_id: str
    created_at: datetime
    savings_account: SavingsAccountRead | None = None
    loan_account: LoanAccountRead | None = None
    fixed_deposit_account: FixedDepositAccountRead | None = None
    investment_holdings: list[InvestmentHoldingRead] | None = None
