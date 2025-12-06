import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# Loads environment variables from .env
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

# Connects to the PostgreSQL database
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# # Tests the database connection
# try:
#     with engine.connect() as connection:
#         print("Database connection established successfully.")
# except Exception as e:
#     print(f"Error connecting to the database: {e}")

# Define the base class for models
class Base(DeclarativeBase):
    pass

# Defines the tables (models). NOTE: Need to run db.py to update DB schema
