from sqlalchemy import create_engine, MetaData

DATABASE_URL = "mysql+pymysql://finance_user:finance_password@127.0.0.1:3306/finance_db"
engine = create_engine(DATABASE_URL)
metadata = MetaData()
metadata.reflect(bind=engine)

print("Dropping all tables...")
metadata.drop_all(bind=engine)
print("Done.")
