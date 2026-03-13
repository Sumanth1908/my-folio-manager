from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session

from app.core.database import get_session
from app.core import security
from app.core.config import settings
from app.models.user import User
from app.deps import get_current_user
from pydantic import BaseModel

router = APIRouter()

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str | None = None

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

@router.post("/register", response_model=UserRead)
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

@router.post("/login", response_model=Token)
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
