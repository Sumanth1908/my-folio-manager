"""
Database reset utility - drops all tables and recreates them with seed data.
"""
from sqlmodel import SQLModel, text

from app.core.database import engine, seed_categories, seed_currencies
from app.models import (Account, Category, Currency, FixedDepositAccount,
                        LoanAccount, SavingsAccount, Transaction)


def reset_database():
    """Drop all tables and recreate them."""
    print("Dropping all tables...")
    
    # Disable foreign key checks for MySQL
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS=0"))
        conn.commit()
    
    try:
        SQLModel.metadata.drop_all(engine)
    finally:
        # Re-enable foreign key checks
        with engine.connect() as conn:
            conn.execute(text("SET FOREIGN_KEY_CHECKS=1"))
            conn.commit()
    
    print("Creating all tables...")
    SQLModel.metadata.create_all(engine)
    
    print("Seeding currencies...")
    seed_currencies()
    
    print("Seeding categories...")
    seed_categories()
    
    print("✅ Database reset complete!")

if __name__ == "__main__":
    reset_database()
