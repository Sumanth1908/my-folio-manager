import os
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine, select

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "mysql+pymysql://finance_user:finance_password@127.0.0.1:3306/finance_db"
)

engine = create_engine(DATABASE_URL, echo=False)


def get_session() -> Generator[Session, None, None]:
    """Dependency to get database session."""
    with Session(engine) as session:
        yield session


def create_db_and_tables() -> None:
    """Create all database tables."""
    SQLModel.metadata.create_all(engine)


def seed_currencies() -> None:
    """Seed default currencies into the database."""
    from app.models import Currency
    
    default_currencies = [
        Currency(code="USD", name="US Dollar", symbol="$"),
        Currency(code="EUR", name="Euro", symbol="€"),
        Currency(code="GBP", name="British Pound", symbol="£"),
        Currency(code="INR", name="Indian Rupee", symbol="₹"),
        Currency(code="JPY", name="Japanese Yen", symbol="¥"),
        Currency(code="CNY", name="Chinese Yuan", symbol="¥"),
        Currency(code="AUD", name="Australian Dollar", symbol="A$"),
        Currency(code="CAD", name="Canadian Dollar", symbol="C$"),
        Currency(code="CHF", name="Swiss Franc", symbol="CHF"),
        Currency(code="SGD", name="Singapore Dollar", symbol="S$"),
    ]
    
    with Session(engine) as session:
        for currency in default_currencies:
            # Check if currency already exists
            existing = session.get(Currency, currency.code)
            if not existing:
                session.add(currency)
        session.commit()


def seed_categories() -> None:
    """Seed default categories into the database."""
    from app.models import Category
    
    default_categories = [
        Category(name="Groceries"),
        Category(name="Rent"),
        Category(name="Utilities"),
        Category(name="Entertainment"),
        Category(name="Transportation"),
        Category(name="Healthcare"),
        Category(name="Shopping"),
        Category(name="Dining"),
        Category(name="Salary"),
        Category(name="Investment"),
    ]
    
    with Session(engine) as session:
        for category in default_categories:
            # Check if category already exists
            existing = session.exec(
                select(Category).where(Category.name == category.name)
            ).first()
            if not existing:
                session.add(category)
        session.commit()
