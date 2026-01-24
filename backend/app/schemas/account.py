from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel

from app.models.account import AccountType
from app.schemas.investment import InvestmentHoldingRead


# Savings Data
class SavingsAccountBase(BaseModel):
    interest_rate: Optional[Decimal] = None
    min_balance: Optional[Decimal] = Decimal("0.00")
    interest_accrual_day: Optional[int] = 1

class SavingsAccountCreate(SavingsAccountBase):
    pass

class SavingsAccountRead(SavingsAccountBase):
    account_id: str
    balance: Decimal = Decimal("0.00")

# Loan Data
class LoanAccountBase(BaseModel):
    loan_amount: Decimal
    interest_rate: Decimal
    tenure_months: int
    emi_amount: Decimal
    start_date: date
    interest_accrual_day: Optional[int] = 1

class LoanAccountCreate(LoanAccountBase):
    pass

class LoanAccountRead(LoanAccountBase):
    account_id: str
    outstanding_amount: Decimal = Decimal("0.00")

# Fixed Deposit Data
class FixedDepositAccountBase(BaseModel):
    principal_amount: Decimal
    interest_rate: Decimal
    start_date: date
    maturity_date: date
    maturity_amount: Decimal
    interest_accrual_day: Optional[int] = 1

class FixedDepositAccountCreate(FixedDepositAccountBase):
    pass

class FixedDepositAccountRead(FixedDepositAccountBase):
    account_id: str

# Base Account
class AccountBase(BaseModel):
    account_name: Optional[str] = None
    account_type: AccountType = AccountType.SAVINGS
    currency: str = "USD"
    status: str = "Active"

class AccountCreate(AccountBase):
    # Optional nested details for creation
    savings_account: Optional[SavingsAccountCreate] = None
    loan_account: Optional[LoanAccountCreate] = None
    fixed_deposit_account: Optional[FixedDepositAccountCreate] = None

class AccountRead(AccountBase):
    account_id: str
    created_at: datetime
    # Nested details
    savings_account: Optional[SavingsAccountRead] = None
    loan_account: Optional[LoanAccountRead] = None
    fixed_deposit_account: Optional[FixedDepositAccountRead] = None
    investment_holdings: Optional[list[InvestmentHoldingRead]] = None

    class Config:
        from_attributes = True
