import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, String
from sqlalchemy.orm import sessionmaker, DeclarativeBase, mapped_column, Mapped

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

# Model for the users table
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)

# Defines the tables (models). NOTE: Need to run db.py to update DB schema
