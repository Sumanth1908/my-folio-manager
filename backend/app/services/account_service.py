from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP
import math
from typing import List, Optional
from dateutil.relativedelta import relativedelta
from sqlmodel import Session, func, select

from app.models import Account, AccountType, Transaction
from app.models.investment_holding import InvestmentHolding
from app.models.interest import InterestPolicy
from app.schemas.account import AccountCreate, AccountRead, AccountUpdate
from app.schemas.interest import InterestPolicyCreate, InterestPolicyUpdate
from app.services import rules_service
from app.services.account_types import get_account_type_definition
from app.services import interest_service


def normalize_recurring_deposit_metadata(metadata: Optional[dict]) -> Optional[dict]:
    """Keep only authoritative RD terms; schedule values derive from dates."""
    if metadata is None:
        return None
    normalized = dict(metadata)

    start_date = normalized.get("start_date")
    maturity_date = normalized.get("maturity_date")
    tenure_months = normalized.get("tenure_months")
    if not maturity_date and start_date and tenure_months:
        try:
            maturity_date = (
                datetime.fromisoformat(str(start_date))
                + relativedelta(months=int(tenure_months))
            ).date().isoformat()
            normalized["maturity_date"] = maturity_date
        except (TypeError, ValueError):
            pass

    # Remove values that can be derived from the authoritative dates.
    if start_date:
        normalized.pop("deposit_day", None)
    if maturity_date:
        normalized.pop("tenure_months", None)
    return normalized


def normalize_car_loan_metadata(metadata: Optional[dict]) -> dict:
    """Complete and validate the principal/rate/EMI/tenure car-loan terms."""
    normalized = dict(metadata or {})
    try:
        principal = Decimal(str(normalized["loan_amount"]))
        annual_rate = Decimal(str(normalized["interest_rate"]))
    except (KeyError, TypeError, ValueError):
        raise ValueError("Loan amount and annual interest rate are required")
    if principal <= 0 or annual_rate < 0:
        raise ValueError("Loan amount must be positive and interest rate cannot be negative")

    tenure = int(normalized.get("tenure_months") or 0)
    emi = Decimal(str(normalized.get("emi_amount") or 0))
    monthly_rate = annual_rate / Decimal("1200")

    if tenure > 0 and emi <= 0:
        if monthly_rate == 0:
            emi = principal / Decimal(tenure)
        else:
            growth = (Decimal("1") + monthly_rate) ** tenure
            emi = principal * monthly_rate * growth / (growth - Decimal("1"))
        normalized["emi_amount"] = float(emi.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))
    elif emi > 0 and tenure <= 0:
        if monthly_rate == 0:
            tenure = math.ceil(float(principal / emi))
        else:
            minimum_payment = principal * monthly_rate
            if emi <= minimum_payment:
                raise ValueError("EMI must be greater than the first month's interest")
            tenure = math.ceil(
                math.log(float(emi / (emi - minimum_payment)))
                / math.log(float(Decimal("1") + monthly_rate))
            )
        normalized["tenure_months"] = tenure
    elif tenure <= 0 or emi <= 0:
        raise ValueError("Provide either a positive EMI or a positive tenure")

    if monthly_rate > 0 and emi <= principal * monthly_rate:
        raise ValueError("EMI must be greater than the first month's interest")

    start_date = normalized.get("start_date")
    if not start_date:
        raise ValueError("Loan start date is required")
    try:
        parsed_start = datetime.fromisoformat(str(start_date))
    except ValueError:
        raise ValueError("Loan start date is invalid")
    if not normalized.get("emi_start_date"):
        normalized["emi_start_date"] = (
            parsed_start + relativedelta(months=1)
        ).date().isoformat()
    normalized.setdefault("principal_balance", float(principal))
    normalized.setdefault("interest_balance", 0.0)
    normalized.setdefault("outstanding_amount", float(principal))
    return normalized


def _car_loan_policy_terms(account: Account) -> dict:
    """Return the server-owned policy fields derived from normalized terms."""
    metadata = account.metadata_ or {}
    return {
        "enabled": True,
        "direction": "CHARGED",
        "annual_rate": metadata["interest_rate"],
        "balance_basis": "PRINCIPAL_OUTSTANDING",
        "day_count": "THIRTY_360",
        "treatment": "INTEREST_DUE",
        "settlement_frequency": "MONTHLY",
        "payout_account_id": None,
        "category_id": None,
        "end_date": (
            datetime.fromisoformat(str(metadata["start_date"]))
            + relativedelta(months=int(metadata["tenure_months"]))
        ),
    }


def car_loan_policy_create(
    account: Account,
) -> InterestPolicyCreate:
    """Apply conventional monthly reducing-balance car-loan terms."""
    metadata = account.metadata_ or {}
    return InterestPolicyCreate(
        **_car_loan_policy_terms(account),
        effective_from=datetime.fromisoformat(str(metadata["start_date"])),
    )


def car_loan_policy_update(
    account: Account,
) -> InterestPolicyUpdate:
    return InterestPolicyUpdate(
        **_car_loan_policy_terms(account),
        effective_from=datetime.now(timezone.utc),
    )


def calculate_asset_value(session: Session, account: Account) -> Decimal:
    """Return the market/manual value of holdings owned by an account."""
    if not get_account_type_definition(account.account_type, account.metadata_).supports_holdings:
        return Decimal("0.00")

    value = session.exec(
        select(
            func.sum(
                InvestmentHolding.quantity
                * func.coalesce(InvestmentHolding.current_price, InvestmentHolding.average_price)
            )
        ).where(InvestmentHolding.account_id == account.account_id)
    ).one()
    return Decimal(str(value or "0.00"))

def calculate_account_balance(session: Session, account: Account) -> Decimal:
    """Calculate balance dynamically based on transactions."""
    
    # Base balance is now stored in metadata if applicable
    base_balance = Decimal("0.00")
    if account.account_type == AccountType.LOAN and account.metadata_:
        base_balance = Decimal(str(account.metadata_.get("loan_amount", "0.00")))
        
    total = session.exec(
        select(func.sum(Transaction.amount)).where(Transaction.account_id == account.account_id)
    ).one() or Decimal("0.00")
    
    if account.account_type == AccountType.LOAN:
        return -base_balance + total  # total includes deposits (credits) minus withdrawals (debits)
    return total

def get_balances_for_accounts(session: Session, accounts: List[Account]) -> dict:
    """Balances for many accounts in ONE grouped query instead of one SUM per account."""
    account_ids = [a.account_id for a in accounts]
    if not account_ids:
        return {}

    rows = session.exec(
        select(Transaction.account_id, func.sum(Transaction.amount))
        .where(Transaction.account_id.in_(account_ids))
        .group_by(Transaction.account_id)
    ).all()
    sums = {account_id: total or Decimal("0.00") for account_id, total in rows}

    balances = {}
    for account in accounts:
        total = sums.get(account.account_id, Decimal("0.00"))
        if account.account_type == AccountType.LOAN:
            base = Decimal(str((account.metadata_ or {}).get("loan_amount", "0.00")))
            balances[account.account_id] = -base + total
        else:
            balances[account.account_id] = total
    return balances


def get_asset_values_for_accounts(session: Session, accounts: List[Account]) -> dict[str, Decimal]:
    """Fetch holding values for a page of accounts in one grouped query."""
    holding_account_ids = [
        account.account_id
        for account in accounts
        if get_account_type_definition(account.account_type, account.metadata_).supports_holdings
    ]
    if not holding_account_ids:
        return {}

    rows = session.exec(
        select(
            InvestmentHolding.account_id,
            func.sum(
                InvestmentHolding.quantity
                * func.coalesce(InvestmentHolding.current_price, InvestmentHolding.average_price)
            ),
        )
        .where(InvestmentHolding.account_id.in_(holding_account_ids))
        .group_by(InvestmentHolding.account_id)
    ).all()
    return {
        account_id: Decimal(str(value or "0.00"))
        for account_id, value in rows
    }

def enrich_account(
    session: Session,
    account: Account,
    balance: Optional[Decimal] = None,
    asset_value: Optional[Decimal] = None,
    interest_policy: Optional[InterestPolicy] = None,
    interest_policy_loaded: bool = False,
) -> AccountRead:
    account_dict = account.model_dump()

    # Calculate real-time balance (callers listing many accounts pass a
    # precomputed balance from get_balances_for_accounts to avoid N+1 queries)
    account_dict['balance'] = balance if balance is not None else calculate_account_balance(session, account)

    type_definition = get_account_type_definition(account.account_type, account.metadata_)
    resolved_asset_value = (
        asset_value if asset_value is not None else calculate_asset_value(session, account)
    )
    account_dict["asset_value"] = resolved_asset_value
    account_dict["net_value"] = (
        resolved_asset_value
        if type_definition.valuation_mode == "HOLDINGS"
        else account_dict["balance"]
    )
    account_dict["account_nature"] = type_definition.nature.value
    policy = (
        interest_policy
        if interest_policy_loaded
        else interest_service.get_interest_policy(session, account.account_id)
    )
    account_dict["interest_policy"] = policy.model_dump() if policy else None

    if type_definition.supports_holdings:
        holdings = session.exec(select(InvestmentHolding).where(InvestmentHolding.account_id == account.account_id)).all()
        account_dict['investment_holdings'] = [h.model_dump() for h in holdings]
        account_dict['asset_holdings'] = account_dict['investment_holdings']

    return AccountRead.model_validate(account_dict)

def get_account_with_ownership(session: Session, account_id: str, user_id: str) -> Optional[Account]:
    account = session.get(Account, account_id)
    if account and account.user_id == user_id:
        return account
    return None

def get_accounts(session: Session, user_id: str, skip: int = 0, limit: int = 100):
    base_query = select(Account).where(Account.user_id == user_id)
    total = session.exec(select(func.count()).select_from(base_query.subquery())).one()
    accounts = session.exec(base_query.offset(skip).limit(limit)).all()
    return accounts, total

def create_account(session: Session, account_in: AccountCreate, user_id: str) -> Account:
    """Create an account with its funding transaction and automation rules in
    ONE database transaction — a failure at any step leaves nothing behind
    instead of a half-provisioned account."""
    account_data = account_in.model_dump(exclude={"interest_policy"})
    if account_data.get("account_type") == AccountType.RECURRING_DEPOSIT:
        account_data["metadata_"] = normalize_recurring_deposit_metadata(
            account_data.get("metadata_")
        )
    elif account_data.get("account_type") == AccountType.LOAN:
        account_data["metadata_"] = normalize_car_loan_metadata(account_data.get("metadata_"))
    account = Account(**account_data, user_id=user_id)
    session.add(account)
    session.flush()

    if account.account_type == AccountType.FIXED_DEPOSIT and account.metadata_:
        principal = Decimal(str(account.metadata_.get("principal_amount", "0.00")))
        start_date = account.metadata_.get("start_date")
        fund_principal = account.metadata_.get("fund_principal", False)
        linked_account_id = account.metadata_.get("linked_account_id")

        if principal > 0:
            if fund_principal and linked_account_id:
                from app.schemas.transaction import TransferRequest
                from app.services.transaction_service import create_transfer_core
                transfer_req = TransferRequest(
                    from_account_id=linked_account_id,
                    to_account_id=account.account_id,
                    amount=principal,
                    description="FD Principal Funding",
                    transaction_date=datetime.fromisoformat(start_date) if start_date else None
                )
                create_transfer_core(session, transfer_req, user_id, commit=False)
            else:
                initial_tx = Transaction(
                    account_id=account.account_id,
                    amount=principal,
                    currency=account.currency,
                    description="Opening Principal",
                    transaction_date=datetime.fromisoformat(start_date) if start_date else datetime.now(timezone.utc)
                )
                session.add(initial_tx)

    policy_input = account_in.interest_policy
    if account.account_type == AccountType.LOAN:
        policy_input = car_loan_policy_create(account)
        account.is_interest_enabled = True

    if policy_input:
        policy = interest_service.create_interest_policy(session, account, policy_input)
        rules_service.upsert_managed_interest_rule(session, account, policy)
    elif account.is_interest_enabled:
        raise ValueError("An interest policy is required when interest is enabled")

    if account.account_type == AccountType.RECURRING_DEPOSIT:
        rules_service.create_rd_auto_deposit_rule(session, account)

    if account.account_type == AccountType.LOAN:
        rules_service.create_loan_auto_debit_rule(session, account)

    session.commit()
    session.refresh(account)
    return account

def update_account(session: Session, account_id: str, account_in: AccountUpdate, user_id: str) -> Optional[Account]:
    account = get_account_with_ownership(session, account_id, user_id)
    if not account:
        return None
        
    updates = account_in.model_dump(exclude_unset=True, exclude={"interest_policy"})
    if account.account_type == AccountType.RECURRING_DEPOSIT:
        updates["metadata_"] = normalize_recurring_deposit_metadata(
            updates.get("metadata_", account.metadata_)
        )
    elif account.account_type == AccountType.LOAN:
        updates["metadata_"] = normalize_car_loan_metadata(
            updates.get("metadata_", account.metadata_)
        )

    for key, value in updates.items():
        setattr(account, key, value)

    session.add(account)
    policy_update = account_in.interest_policy
    if account.account_type == AccountType.LOAN:
        policy_update = car_loan_policy_update(account)
        account.is_interest_enabled = True

    if policy_update is not None:
        policy = interest_service.update_interest_policy(session, account, policy_update)
        rules_service.upsert_managed_interest_rule(session, account, policy)
    elif existing_policy := interest_service.get_interest_policy(session, account.account_id):
        rules_service.upsert_managed_interest_rule(session, account, existing_policy)
    elif account.is_interest_enabled:
        raise ValueError("Interest-enabled accounts require a managed interest policy")
    if account.account_type == AccountType.LOAN:
        rules_service.create_loan_auto_debit_rule(session, account)
    session.commit()
    session.refresh(account)
    return account

def close_account(session: Session, account_id: str, user_id: str, source_account_id: Optional[str] = None) -> Account:
    account = get_account_with_ownership(session, account_id, user_id)
    if not account:
        raise ValueError("Account not found")

    if account.status == "Closed":
        raise ValueError("Account is already closed")

    if account.account_type == AccountType.LOAN:
        balance = calculate_account_balance(session, account)
        if balance < 0:
            outstanding = -balance
            from app.schemas.transaction import TransactionCreate, TransferRequest
            from app.services.transaction_service import create_transaction_core, create_transfer_core

            if source_account_id:
                source_account = get_account_with_ownership(session, source_account_id, user_id)
                if not source_account:
                    raise ValueError("Source account not found")
                if source_account.account_type != AccountType.SAVINGS:
                    raise ValueError("Loan payoff can only be settled from a savings account")
                if source_account.currency != account.currency:
                    raise ValueError("Source account currency must match the loan account currency")

                create_transfer_core(
                    session,
                    TransferRequest(
                        from_account_id=source_account_id,
                        to_account_id=account_id,
                        amount=outstanding,
                        description="Loan Closure Payoff"
                    ),
                    user_id
                )
            else:
                create_transaction_core(
                    session,
                    TransactionCreate(
                        account_id=account_id,
                        amount=outstanding,
                        description="Loan Closure Payoff (Cash/External)"
                    ),
                    user_id
                )
            session.refresh(account)

    account.status = "Closed"
    session.add(account)

    # Stop any pending automation from continuing to post. This must include
    # rules OWNED BY OTHER ACCOUNTS that reference this one (e.g. an RD
    # auto-deposit rule lives on the linked savings account).
    from app.models.rule import Rule
    user_rules = session.exec(
        select(Rule).join(Account, Rule.account_id == Account.account_id)
        .where(Account.user_id == user_id, Rule.is_active.is_(True))
    ).all()
    for rule in user_rules:
        config = rule.configuration or {}
        references_account = (
            rule.account_id == account_id
            or config.get("source_account_id") == account_id
            or config.get("target_account_id") == account_id
        )
        if references_account:
            rule.is_active = False
            rule.next_run_at = None
            session.add(rule)

    session.commit()
    session.refresh(account)
    return account

def delete_account(session: Session, account_id: str, user_id: str) -> bool:
    account = get_account_with_ownership(session, account_id, user_id)
    if not account:
        return False
        
    # 1. Clean up transfer counterpart transactions
    transfers = session.exec(select(Transaction).where(Transaction.account_id == account_id, Transaction.transfer_id.is_not(None))).all()
    transfer_ids = [t.transfer_id for t in transfers if t.transfer_id]
    if transfer_ids:
        counterparts = session.exec(select(Transaction).where(Transaction.transfer_id.in_(transfer_ids))).all()
        for tx in counterparts:
            session.delete(tx)
            
    # 2. Clean up rules that reference this account in their configuration
    from app.models.rule import Rule
    user_rules = session.exec(select(Rule).join(Account).where(Account.user_id == user_id)).all()
    for rule in user_rules:
        if rule.configuration:
            if rule.configuration.get("source_account_id") == account_id or rule.configuration.get("target_account_id") == account_id:
                session.delete(rule)
                
    # 3. Clean up RD accounts that link to this account
    user_accounts = session.exec(select(Account).where(Account.user_id == user_id)).all()
    for acc in user_accounts:
        if acc.account_type == AccountType.RECURRING_DEPOSIT and acc.metadata_ and acc.metadata_.get("linked_account_id") == account_id:
            # We don't delete the RD account, but we remove the link so it doesn't break.
            # Copy the dict: in-place mutation never marks the JSON column dirty.
            new_metadata = dict(acc.metadata_)
            new_metadata["linked_account_id"] = None
            acc.metadata_ = new_metadata
            session.add(acc)

    session.delete(account)
    session.commit()
    return True
