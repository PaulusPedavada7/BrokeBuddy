from pydantic import BaseModel
from datetime import datetime

# Schema for user creation
class UserCreate(BaseModel):
    first_name: str
    last_name: str
    email: str
    password: str

# Schema for user sign in
class UserSignIn(BaseModel):
    email: str
    password: str

class TransactionCreate(BaseModel):
    amount: float
    category: str
    description: str
    date: datetime