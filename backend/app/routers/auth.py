import re
from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from app.core.database import get_session
from app.core import security
from app.core.config import settings
from app.core.rate_limit import rate_limit
from app.models.user import User
from app.deps import get_current_user
from pydantic import BaseModel, field_validator

router = APIRouter()

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MIN_PASSWORD_LENGTH = 8

def _validate_password(value: str) -> str:
    if len(value) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters long")
    return value

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str | None = None

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("Invalid email address")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        return _validate_password(v)

class UserRead(BaseModel):
    user_id: str
    email: str
    full_name: str | None = None

class Token(BaseModel):
    access_token: str
    token_type: str

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        return _validate_password(v)

@router.post("/register", response_model=UserRead, dependencies=[Depends(rate_limit("register", limit=5, window_seconds=60))])
def register(user_in: UserCreate, session: Session = Depends(get_session)) -> Any:
    user = session.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this email already exists in the system",
        )
    user = User(
        email=user_in.email,
        password_hash=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Seed default categories for the new user
    default_categories = [
        "Groceries", "Rent", "Utilities", "Entertainment",
        "Transportation", "Healthcare", "Shopping", "Dining",
        "Salary", "Investment"
    ]
    
    from app.models.category import Category
    for cat_name in default_categories:
        category = Category(name=cat_name, user_id=user.user_id)
        session.add(category)
    session.commit()
    
    return user

@router.post("/login", response_model=Token, dependencies=[Depends(rate_limit("login", limit=10, window_seconds=60))])
def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session),
) -> Any:
    user = session.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.user_id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_user)) -> Any:
    return current_user

@router.post("/change-password")
def change_password(
    data: ChangePassword,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user),
) -> Any:
    if not security.verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect password")
    
    current_user.password_hash = security.get_password_hash(data.new_password)
    session.add(current_user)
    session.commit()
    
    return {"message": "Password updated successfully"}
