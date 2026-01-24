from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.models import Currency

router = APIRouter(prefix="/currencies", tags=["currencies"])


@router.get("/", response_model=List[Currency])
def list_currencies(session: Session = Depends(get_session)):
    """Get all available currencies."""
    currencies = session.exec(select(Currency)).all()
    return currencies


@router.post("/", response_model=Currency)
def create_currency(currency: Currency, session: Session = Depends(get_session)):
    """Create a new currency."""
    # Check if currency already exists
    existing = session.get(Currency, currency.code)
    if existing:
        raise HTTPException(status_code=400, detail=f"Currency {currency.code} already exists")
    
    session.add(currency)
    session.commit()
    session.refresh(currency)
    return currency


@router.get("/{code}", response_model=Currency)
def get_currency(code: str, session: Session = Depends(get_session)):
    """Get a specific currency by code."""
    currency = session.get(Currency, code.upper())
    if not currency:
        raise HTTPException(status_code=404, detail=f"Currency {code} not found")
    return currency
