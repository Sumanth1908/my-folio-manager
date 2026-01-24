from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.models.account import Account, AccountType
from app.models.fixed_deposit_account import FixedDepositAccount
from app.models.loan_account import LoanAccount
from app.models.savings_account import SavingsAccount
from app.models.transaction import Transaction
from app.models.investment_holding import InvestmentHolding
from app.models.user import User
from app.schemas.account import AccountCreate, AccountRead
from app.schemas.investment import InvestmentHoldingCreate, InvestmentHoldingRead
from app.services.account_service import calculate_account_balance
from app.deps import get_current_user

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.post("/", response_model=AccountRead)
def create_account(
    account_in: AccountCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Create a new account with specific details."""
    # Separate specific details data
    savings_data = account_in.savings_account
    loan_data = account_in.loan_account
    fd_data = account_in.fixed_deposit_account
    
    # Exclude nested data to create base account
    account_data = account_in.model_dump(exclude={"savings_account", "loan_account", "fixed_deposit_account"})
    
    account = Account(**account_data, user_id=current_user.user_id)
    
    session.add(account)
    session.commit()
    session.refresh(account)
    
    # Create specific account details based on type
    if account.account_type == AccountType.SAVINGS and savings_data:
        savings_account = SavingsAccount(
            account_id=account.account_id,
            **savings_data.model_dump()
        )
        session.add(savings_account)
        
    elif account.account_type == AccountType.LOAN and loan_data:
        # Initialize outstanding_amount to loan_amount for new loans
        loan_account = LoanAccount(
            account_id=account.account_id,
            **loan_data.model_dump(),
            outstanding_amount=loan_data.loan_amount
        )
        session.add(loan_account)
        
    elif account.account_type == AccountType.FIXED_DEPOSIT and fd_data:
        fd_account = FixedDepositAccount(
            account_id=account.account_id,
            **fd_data.model_dump()
        )
        session.add(fd_account)
        
        # Create initial transaction for the principal amount
        initial_transaction = Transaction(
            account_id=account.account_id,
            user_id=current_user.user_id, # Assign user
            amount=fd_account.principal_amount,
            transaction_type="Credit",
            currency=account.currency,
            description="Opening Principal",
            transaction_date=fd_account.start_date
        )
        session.add(initial_transaction)

    session.commit()
    session.refresh(account)
    return account


from app.schemas.common import PaginatedResponse
from sqlmodel import func

@router.get("/", response_model=PaginatedResponse[AccountRead])
def read_accounts(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get all accounts for the current user."""
    # Filter by user_id
    base_query = select(Account).where(Account.user_id == current_user.user_id)
    
    # Count total
    count_query = select(func.count()).select_from(base_query.subquery())
    total = session.exec(count_query).one()
    
    # Apply pagination
    query = base_query.offset(skip).limit(limit)
    accounts = session.exec(query).all()
    
    # Populate nested details for each account
    items = []
    for account in accounts:
        account_dict = account.model_dump()
        
        # Fetch type-specific details based on account_type
        if account.account_type == AccountType.SAVINGS:
            savings = session.get(SavingsAccount, account.account_id)
            if savings:
                savings_dict = savings.model_dump()
                # Calculate Dynamic Balance
                savings_dict['balance'] = calculate_account_balance(session, account)
                account_dict['savings_account'] = savings_dict
            else:
                account_dict['savings_account'] = None
            
        elif account.account_type == AccountType.LOAN:
            loan = session.get(LoanAccount, account.account_id)
            if loan:
                loan_dict = loan.model_dump()
                # Calculate Dynamic Outstanding Amount
                loan_dict['outstanding_amount'] = calculate_account_balance(session, account)
                account_dict['loan_account'] = loan_dict
            else:
                account_dict['loan_account'] = None
            
        elif account.account_type == AccountType.FIXED_DEPOSIT:
            fd = session.get(FixedDepositAccount, account.account_id)
            account_dict['fixed_deposit_account'] = fd.model_dump() if fd else None

        elif account.account_type == AccountType.INVESTMENT:
            holdings_query = select(InvestmentHolding).where(InvestmentHolding.account_id == account.account_id)
            holdings = session.exec(holdings_query).all()
            account_dict['investment_holdings'] = [h.model_dump() for h in holdings]
        
        items.append(AccountRead.model_validate(account_dict))
    
    return PaginatedResponse(
        items=items,
        total=total,
        skip=skip,
        limit=limit
    )


@router.get("/{account_id}", response_model=AccountRead)
def read_account(
    account_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Get a specific account with details."""
    account = session.get(Account, account_id)
    if not account or account.user_id != current_user.user_id:
        raise HTTPException(status_code=404, detail="Account not found")
        
    account_dict = account.model_dump()
    
    if account.account_type == AccountType.SAVINGS:
        savings = session.get(SavingsAccount, account.account_id)
        if savings:
            savings_dict = savings.model_dump()
            savings_dict['balance'] = calculate_account_balance(session, account)
            account_dict['savings_account'] = savings_dict
            
    elif account.account_type == AccountType.LOAN:
        loan = session.get(LoanAccount, account.account_id)
        if loan:
            loan_dict = loan.model_dump()
            loan_dict['outstanding_amount'] = calculate_account_balance(session, account)
            account_dict['loan_account'] = loan_dict
            
    elif account.account_type == AccountType.FIXED_DEPOSIT:
        fd = session.get(FixedDepositAccount, account.account_id)
        if fd:
            account_dict['fixed_deposit_account'] = fd.model_dump()

    elif account.account_type == AccountType.INVESTMENT:
        holdings_query = select(InvestmentHolding).where(InvestmentHolding.account_id == account.account_id)
        holdings = session.exec(holdings_query).all()
        account_dict['investment_holdings'] = [h.model_dump() for h in holdings]
            
    return AccountRead.model_validate(account_dict)


@router.delete("/{account_id}")
def delete_account(
    account_id: str, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete an account and all its associated transactions."""
    account = session.get(Account, account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
        
    if account.user_id != current_user.user_id:
         raise HTTPException(status_code=403, detail="Not authorized to delete this account")

    # CASCADE delete will automatically handle transactions and child account records
    session.delete(account)
    session.commit()
    return {"message": "Account deleted successfully"}



