from sqlmodel import SQLModel, create_engine, text
from app.core.config import settings
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.rule import Rule
from app.models.savings_account import SavingsAccount
from app.models.loan_account import LoanAccount
from app.models.fixed_deposit_account import FixedDepositAccount

# Use the same database URL as the app
DATABASE_URL = "mysql+pymysql://finance_user:finance_password@127.0.0.1:3306/finance_db"
engine = create_engine(DATABASE_URL, echo=True)

def reset_db():
    print("Dropping all tables...")
    # Drop all tables manually or via metadata
    # SQLAlchemy's drop_all might not work perfectly with foreign keys sometimes if not ordered, 
    # but usually it handles it.
    
    # Disable foreign key checks for MySQL to ensure smooth dropping
    with engine.connect() as conn:
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
        SQLModel.metadata.drop_all(engine)
        conn.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
        conn.commit()
    
    print("Creating all tables...")
    SQLModel.metadata.create_all(engine)
    print("Database reset complete.")

if __name__ == "__main__":
    reset_db()
